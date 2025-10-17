const mongoose = require('mongoose');

const recyclingCreditSchema = new mongoose.Schema({
  creditId: {
    type: String,
    required: [true, 'Credit ID is required'],
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: [true, 'Collection reference is required']
  },
  wasteType: {
    type: String,
    enum: ['recyclable', 'electronic', 'organic', 'hazardous'],
    required: [true, 'Waste type is required']
  },
  subType: {
    type: String,
    enum: [
      // Electronic waste
      'smartphone', 'laptop', 'desktop', 'tablet', 'television', 'refrigerator', 
      'washing_machine', 'air_conditioner', 'battery', 'electronic_component',
      // Recyclable materials
      'plastic_bottles', 'glass_bottles', 'aluminum_cans', 'paper', 'cardboard', 
      'metal_scrap', 'textile', 'rubber',
      // Organic waste
      'food_waste', 'garden_waste', 'wood', 'biodegradable',
      // Hazardous materials
      'chemical_waste', 'medical_waste', 'paint', 'oil'
    ]
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0, 'Weight cannot be negative']
  },
  volume: {
    type: Number,
    min: [0, 'Volume cannot be negative']
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'contaminated'],
    required: [true, 'Quality assessment is required']
  },
  qualityScore: {
    type: Number,
    min: [0, 'Quality score cannot be negative'],
    max: [100, 'Quality score cannot exceed 100'],
    required: [true, 'Quality score is required']
  },
  verification: {
    method: {
      type: String,
      enum: ['visual_inspection', 'weighing_scale', 'barcode_scan', 'manual_assessment', 'ai_recognition'],
      required: [true, 'Verification method is required']
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Verifier reference is required']
    },
    verificationDate: {
      type: Date,
      default: Date.now
    },
    photos: [String], // URLs to verification photos
    notes: String,
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 95
    }
  },
  creditCalculation: {
    baseRate: {
      type: Number,
      required: [true, 'Base rate is required']
    },
    qualityMultiplier: {
      type: Number,
      required: [true, 'Quality multiplier is required']
    },
    bonusMultipliers: [{
      type: {
        type: String,
        enum: ['volume_bonus', 'consistency_bonus', 'rare_material_bonus', 'clean_sorting_bonus']
      },
      multiplier: Number,
      reason: String
    }],
    grossCredits: {
      type: Number,
      required: [true, 'Gross credits is required']
    },
    deductions: [{
      reason: {
        type: String,
        enum: ['contamination', 'poor_sorting', 'damage', 'incomplete_item']
      },
      amount: Number,
      description: String
    }],
    netCredits: {
      type: Number,
      required: [true, 'Net credits is required']
    }
  },
  monetaryValue: {
    creditValue: {
      type: Number,
      required: [true, 'Credit value is required']
    },
    exchangeRate: {
      type: Number,
      required: [true, 'Exchange rate is required'] // Credits to LKR
    },
    monetaryAmount: {
      type: Number,
      required: [true, 'Monetary amount is required']
    },
    currency: {
      type: String,
      default: 'LKR'
    }
  },
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'credited', 'disputed', 'rejected'],
    default: 'pending_verification'
  },
  processing: {
    processingDate: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paymentMethod: {
      type: String,
      enum: ['account_credit', 'mobile_payment', 'bank_transfer', 'discount_voucher']
    },
    paymentReference: String,
    paymentDate: Date
  },
  environmental: {
    carbonFootprintReduction: { // kg CO2 equivalent
      type: Number,
      default: 0
    },
    energySaved: { // kWh
      type: Number,
      default: 0
    },
    waterSaved: { // liters
      type: Number,
      default: 0
    },
    landfillDiversion: { // kg diverted from landfill
      type: Number,
      default: 0
    }
  },
  location: {
    collectionPoint: {
      type: String,
      required: [true, 'Collection point is required']
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required']
    },
    district: String,
    city: String
  },
  metadata: {
    seasonalBonus: Number,
    campaignBonus: Number,
    milestoneBonus: Number,
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum']
    },
    tags: [String],
    notes: String
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate creditId and calculate final values
recyclingCreditSchema.pre('save', function(next) {
  if (!this.creditId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.creditId = `RC-${timestamp}-${random}`;
  }

  // Calculate environmental impact if not set
  if (this.environmental.carbonFootprintReduction === 0) {
    this.environmental = this.calculateEnvironmentalImpact();
  }

  // Calculate monetary value
  this.monetaryValue.monetaryAmount = 
    this.creditCalculation.netCredits * this.monetaryValue.exchangeRate;

  next();
});

// Method to calculate environmental impact based on waste type and weight
recyclingCreditSchema.methods.calculateEnvironmentalImpact = function() {
  const impactFactors = {
    electronic: {
      carbonReduction: 2.5, // kg CO2 per kg of e-waste
      energySaved: 15, // kWh per kg
      waterSaved: 50, // liters per kg
      landfillDiversion: 1.0 // 1:1 ratio
    },
    recyclable: {
      carbonReduction: 1.2,
      energySaved: 8,
      waterSaved: 25,
      landfillDiversion: 1.0
    },
    organic: {
      carbonReduction: 0.8,
      energySaved: 3,
      waterSaved: 10,
      landfillDiversion: 1.0
    },
    hazardous: {
      carbonReduction: 3.0,
      energySaved: 20,
      waterSaved: 100,
      landfillDiversion: 1.0
    }
  };

  const factors = impactFactors[this.wasteType] || impactFactors.recyclable;

  return {
    carbonFootprintReduction: this.weight * factors.carbonReduction,
    energySaved: this.weight * factors.energySaved,
    waterSaved: this.weight * factors.waterSaved,
    landfillDiversion: this.weight * factors.landfillDiversion
  };
};

// Method to calculate credits based on material type, quality, and weight
recyclingCreditSchema.methods.calculateCredits = function(billingRate) {
  const materialRates = this.getMaterialRates();
  const baseRate = materialRates[this.wasteType]?.[this.subType] || 
                  materialRates[this.wasteType]?.default || 1.0;

  const qualityMultipliers = {
    excellent: 1.3,
    good: 1.0,
    fair: 0.7,
    poor: 0.4,
    contaminated: 0.2
  };

  const qualityMultiplier = qualityMultipliers[this.quality] || 1.0;
  
  // Calculate bonus multipliers
  let bonusMultiplier = 1.0;
  if (this.creditCalculation.bonusMultipliers) {
    bonusMultiplier = this.creditCalculation.bonusMultipliers.reduce(
      (acc, bonus) => acc * bonus.multiplier, 1.0
    );
  }

  const grossCredits = this.weight * baseRate * qualityMultiplier * bonusMultiplier;

  // Apply deductions
  const totalDeductions = (this.creditCalculation.deductions || []).reduce(
    (sum, deduction) => sum + deduction.amount, 0
  );

  const netCredits = Math.max(0, grossCredits - totalDeductions);

  this.creditCalculation = {
    ...this.creditCalculation,
    baseRate,
    qualityMultiplier,
    grossCredits,
    netCredits
  };

  return netCredits;
};

// Method to get material-specific rates
recyclingCreditSchema.methods.getMaterialRates = function() {
  return {
    electronic: {
      smartphone: 25.0,
      laptop: 40.0,
      desktop: 35.0,
      tablet: 20.0,
      television: 30.0,
      refrigerator: 50.0,
      washing_machine: 45.0,
      air_conditioner: 55.0,
      battery: 15.0,
      electronic_component: 10.0,
      default: 20.0
    },
    recyclable: {
      plastic_bottles: 2.0,
      glass_bottles: 1.5,
      aluminum_cans: 8.0,
      paper: 1.0,
      cardboard: 0.8,
      metal_scrap: 5.0,
      textile: 3.0,
      rubber: 2.5,
      default: 2.0
    },
    organic: {
      food_waste: 0.5,
      garden_waste: 0.3,
      wood: 1.0,
      biodegradable: 0.4,
      default: 0.4
    },
    hazardous: {
      chemical_waste: 20.0,
      medical_waste: 25.0,
      paint: 15.0,
      oil: 18.0,
      default: 18.0
    }
  };
};

// Method to process credit payout
recyclingCreditSchema.methods.processCredit = async function(paymentMethod, processedBy) {
  this.status = 'credited';
  this.processing = {
    processingDate: new Date(),
    processedBy: processedBy,
    paymentMethod: paymentMethod,
    paymentReference: this.generatePaymentReference(),
    paymentDate: new Date()
  };

  return this.save();
};

// Method to generate payment reference
recyclingCreditSchema.methods.generatePaymentReference = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `PAY-RC-${timestamp}-${random}`;
};

// Method to dispute a credit
recyclingCreditSchema.methods.dispute = async function(reason, disputedBy) {
  this.status = 'disputed';
  this.metadata.notes = `Disputed: ${reason}`;
  
  return this.save();
};

// Virtual for total environmental savings
recyclingCreditSchema.virtual('totalEnvironmentalSavings').get(function() {
  return {
    carbon: this.environmental.carbonFootprintReduction,
    energy: this.environmental.energySaved,
    water: this.environmental.waterSaved,
    waste: this.environmental.landfillDiversion
  };
});

// Virtual for effective credit rate (credits per kg)
recyclingCreditSchema.virtual('effectiveCreditRate').get(function() {
  return this.weight > 0 ? this.creditCalculation.netCredits / this.weight : 0;
});

// Indexes for efficient queries
recyclingCreditSchema.index({ creditId: 1 });
recyclingCreditSchema.index({ user: 1 });
recyclingCreditSchema.index({ collection: 1 });
recyclingCreditSchema.index({ status: 1 });
recyclingCreditSchema.index({ wasteType: 1, subType: 1 });
recyclingCreditSchema.index({ 'verification.verificationDate': -1 });
recyclingCreditSchema.index({ 'processing.processingDate': -1 });
recyclingCreditSchema.index({ createdAt: -1 });
recyclingCreditSchema.index({ 'location.district': 1 });

module.exports = mongoose.model('RecyclingCredit', recyclingCreditSchema);