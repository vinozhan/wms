const mongoose = require('mongoose');

const billingRateSchema = new mongoose.Schema({
  rateId: {
    type: String,
    required: [true, 'Rate ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Rate name is required'],
    trim: true
  },
  description: String,
  district: {
    type: String,
    required: [true, 'District is required']
  },
  billingModel: {
    type: String,
    enum: ['weight_based', 'volume_based', 'flat_rate', 'hybrid'],
    required: [true, 'Billing model is required']
  },
  rates: {
    baseRate: {
      amount: { type: Number, default: 0 },
      description: { type: String, default: 'Base service fee' }
    },
    weightRates: [{
      wasteType: {
        type: String,
        enum: ['general', 'recyclable', 'organic', 'hazardous', 'electronic'],
        required: true
      },
      rate: { type: Number, required: true }, // per kg
      currency: { type: String, default: 'LKR' },
      minCharge: { type: Number, default: 0 },
      maxCharge: { type: Number, default: null },
      tiers: [{
        minWeight: { type: Number, required: true },
        maxWeight: { type: Number, required: true },
        rate: { type: Number, required: true }
      }]
    }],
    volumeRates: [{
      wasteType: {
        type: String,
        enum: ['general', 'recyclable', 'organic', 'hazardous', 'electronic'],
        required: true
      },
      rate: { type: Number, required: true }, // per liter
      currency: { type: String, default: 'LKR' },
      minCharge: { type: Number, default: 0 },
      maxCharge: { type: Number, default: null }
    }],
    specialServices: [{
      service: {
        type: String,
        enum: ['bulk_collection', 'hazardous_disposal', 'express_collection', 'bin_maintenance', 'emergency_collection'],
        required: true
      },
      rate: { type: Number, required: true },
      unit: {
        type: String,
        enum: ['per_service', 'per_hour', 'per_kg', 'per_item'],
        default: 'per_service'
      },
      currency: { type: String, default: 'LKR' }
    }]
  },
  recyclingIncentives: {
    enabled: { type: Boolean, default: true },
    rates: [{
      wasteType: {
        type: String,
        enum: ['recyclable', 'electronic', 'organic'],
        required: true
      },
      creditRate: { type: Number, required: true }, // credits per kg
      maxCreditsPerMonth: { type: Number, default: 1000 },
      qualityMultiplier: {
        clean: { type: Number, default: 1.0 },
        contaminated: { type: Number, default: 0.5 },
        mixed: { type: Number, default: 0.7 }
      }
    }]
  },
  penalties: [{
    type: {
      type: String,
      enum: ['late_payment', 'contamination', 'overweight', 'missed_collection', 'improper_sorting'],
      required: true
    },
    amount: { type: Number, required: true },
    description: String,
    isPercentage: { type: Boolean, default: false }
  }],
  discounts: [{
    type: {
      type: String,
      enum: ['early_payment', 'loyalty', 'volume', 'senior_citizen', 'low_income', 'environmental'],
      required: true
    },
    amount: { type: Number, required: true },
    isPercentage: { type: Boolean, default: true },
    conditions: {
      minimumPeriod: Number, // months
      minimumVolume: Number, // kg or liters
      qualificationCriteria: String
    },
    description: String
  }],
  taxConfiguration: {
    taxRate: { type: Number, default: 0.15 }, // 15% tax
    taxType: {
      type: String,
      enum: ['VAT', 'service_tax', 'environmental_tax'],
      default: 'VAT'
    },
    taxIncluded: { type: Boolean, default: false }
  },
  effectiveFrom: {
    type: Date,
    required: [true, 'Effective date is required']
  },
  effectiveTo: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Approval is required']
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

billingRateSchema.pre('save', function(next) {
  if (!this.rateId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.rateId = `RATE-${timestamp}-${random}`;
  }
  next();
});

billingRateSchema.methods.calculateCost = function(wasteData) {
  let totalCost = this.rates.baseRate.amount;
  let recyclingCredits = 0;
  
  // Calculate weight-based charges
  if (this.billingModel === 'weight_based' || this.billingModel === 'hybrid') {
    wasteData.collections?.forEach(collection => {
      const weightRate = this.rates.weightRates.find(r => r.wasteType === collection.wasteType);
      if (weightRate && collection.weight) {
        // Check for tiered pricing
        let rate = weightRate.rate;
        if (weightRate.tiers && weightRate.tiers.length > 0) {
          const tier = weightRate.tiers.find(t => 
            collection.weight >= t.minWeight && collection.weight <= t.maxWeight
          );
          if (tier) rate = tier.rate;
        }
        
        let cost = collection.weight * rate;
        if (weightRate.minCharge && cost < weightRate.minCharge) cost = weightRate.minCharge;
        if (weightRate.maxCharge && cost > weightRate.maxCharge) cost = weightRate.maxCharge;
        
        totalCost += cost;
        
        // Calculate recycling credits
        if (this.recyclingIncentives.enabled) {
          const incentive = this.recyclingIncentives.rates.find(r => r.wasteType === collection.wasteType);
          if (incentive) {
            const quality = collection.quality || 'mixed';
            const multiplier = incentive.qualityMultiplier[quality] || 0.7;
            recyclingCredits += collection.weight * incentive.creditRate * multiplier;
          }
        }
      }
    });
  }
  
  // Calculate volume-based charges
  if (this.billingModel === 'volume_based' || this.billingModel === 'hybrid') {
    wasteData.collections?.forEach(collection => {
      const volumeRate = this.rates.volumeRates.find(r => r.wasteType === collection.wasteType);
      if (volumeRate && collection.volume) {
        let cost = collection.volume * volumeRate.rate;
        if (volumeRate.minCharge && cost < volumeRate.minCharge) cost = volumeRate.minCharge;
        if (volumeRate.maxCharge && cost > volumeRate.maxCharge) cost = volumeRate.maxCharge;
        totalCost += cost;
      }
    });
  }
  
  // Add special service charges
  wasteData.specialServices?.forEach(service => {
    const serviceRate = this.rates.specialServices.find(s => s.service === service.type);
    if (serviceRate) {
      totalCost += service.quantity * serviceRate.rate;
    }
  });
  
  return {
    subtotal: totalCost,
    recyclingCredits,
    netAmount: totalCost,
    breakdown: {
      baseRate: this.rates.baseRate.amount,
      wasteCharges: totalCost - this.rates.baseRate.amount,
      recyclingCredits,
      currency: 'LKR'
    }
  };
};

billingRateSchema.methods.applyDiscounts = function(cost, discountTypes = []) {
  let discountAmount = 0;
  
  discountTypes.forEach(discountType => {
    const discount = this.discounts.find(d => d.type === discountType);
    if (discount) {
      if (discount.isPercentage) {
        discountAmount += (cost.subtotal * discount.amount / 100);
      } else {
        discountAmount += discount.amount;
      }
    }
  });
  
  return {
    ...cost,
    discountAmount,
    netAmount: Math.max(0, cost.subtotal - cost.recyclingCredits - discountAmount)
  };
};

billingRateSchema.methods.applyPenalties = function(cost, penaltyTypes = []) {
  let penaltyAmount = 0;
  
  penaltyTypes.forEach(penaltyType => {
    const penalty = this.penalties.find(p => p.type === penaltyType);
    if (penalty) {
      if (penalty.isPercentage) {
        penaltyAmount += (cost.subtotal * penalty.amount / 100);
      } else {
        penaltyAmount += penalty.amount;
      }
    }
  });
  
  return {
    ...cost,
    penaltyAmount,
    netAmount: cost.subtotal - cost.recyclingCredits - (cost.discountAmount || 0) + penaltyAmount
  };
};

billingRateSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && 
         this.effectiveFrom <= now && 
         (!this.effectiveTo || this.effectiveTo >= now);
});

billingRateSchema.index({ rateId: 1 });
billingRateSchema.index({ district: 1 });
billingRateSchema.index({ billingModel: 1 });
billingRateSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
billingRateSchema.index({ isActive: 1 });

module.exports = mongoose.model('BillingRate', billingRateSchema);