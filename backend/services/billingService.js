const { Payment, Collection, User, WasteBin } = require('../models');

// Billing rates configuration
const BILLING_RATES = {
  resident: {
    baseRate: 500, // LKR per month
    wasteRates: {
      general: 30, // LKR per kg
      recyclable: 15, // LKR per kg (lower rate to encourage recycling)
      organic: 25, // LKR per kg
      hazardous: 100 // LKR per kg (higher rate for special handling)
    },
    recyclingBonus: {
      threshold: 10, // kg per month
      bonusRate: 5 // LKR per kg above threshold
    },
    taxRate: 0.15 // 15% tax
  },
  business: {
    baseRate: 2000, // LKR per month (higher for businesses)
    wasteRates: {
      general: 40, // LKR per kg (higher than residential)
      recyclable: 20, // LKR per kg
      organic: 35, // LKR per kg
      hazardous: 150 // LKR per kg
    },
    recyclingBonus: {
      threshold: 50, // kg per month (higher threshold)
      bonusRate: 8 // LKR per kg above threshold
    },
    taxRate: 0.18, // 18% tax for businesses
    volumeDiscount: {
      threshold: 500, // kg per month
      discountRate: 0.1 // 10% discount for high volume
    }
  }
};

// Penalty rates
const PENALTIES = {
  contamination: 200, // LKR per incident
  overweight: 50, // LKR per kg over limit
  missedCollection: 100, // LKR per missed collection
  latePayment: {
    rate: 0.02, // 2% of total amount
    gracePeriod: 7 // days
  }
};

class BillingService {
  
  // Generate bill immediately when collection is completed (event-driven)
  static async generateBillOnCollection(collectionId) {
    try {
      const collection = await Collection.findById(collectionId)
        .populate([
          {
            path: 'wasteBin',
            populate: { path: 'owner', select: 'name email userType' }
          }
        ]);

      if (!collection) {
        throw new Error('Collection not found');
      }

      if (collection.status !== 'completed') {
        throw new Error('Collection must be completed to generate bill');
      }

      const user = collection.wasteBin.owner;
      if (!['resident', 'business'].includes(user.userType)) {
        console.log(`Skipping billing for user type: ${user.userType}`);
        return null;
      }

      // Calculate charges for this specific collection
      const charges = this.calculateCollectionCharges(collection, user.userType);
      
      // Create immediate payment record
      const payment = new Payment({
        user: user._id,
        billingPeriod: {
          startDate: collection.actualCollectionDate,
          endDate: collection.actualCollectionDate
        },
        collections: [collection._id],
        charges: charges.chargeBreakdown,
        totals: charges.totals,
        paymentDetails: {
          method: 'credit_card'
        },
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        notes: {
          systemNotes: `Auto-generated bill for collection ${collection.collectionId} on ${collection.actualCollectionDate.toISOString().split('T')[0]}`
        }
      });

      await payment.save();
      
      console.log(`Generated bill ${payment.invoiceNumber} for collection ${collection.collectionId}: LKR ${charges.totals.totalAmount.toFixed(2)}`);
      return payment;

    } catch (error) {
      console.error('Error generating bill on collection:', error);
      throw error;
    }
  }

  // Calculate charges for a single collection
  static calculateCollectionCharges(collection, userType) {
    const rates = BILLING_RATES[userType];
    const wasteData = collection.wasteData;
    
    if (!wasteData) {
      throw new Error('Collection must have waste data to generate bill');
    }

    const weight = wasteData.weight || 0;
    const wasteType = wasteData.wasteType || 'general';
    const rate = rates.wasteRates[wasteType] || rates.wasteRates.general;
    
    // Base charge calculation
    let subtotal = weight * rate;
    
    const wasteCharges = [{
      binId: collection.wasteBin._id,
      wasteType,
      weight,
      volume: wasteData.volume || 0,
      rate,
      amount: subtotal
    }];

    // Calculate penalties
    const penalties = this.calculateCollectionPenalties(collection);
    const penaltyAmount = penalties.reduce((sum, penalty) => sum + penalty.amount, 0);

    // Calculate discounts (recycling bonus for single collection)
    const discounts = [];
    if (wasteType === 'recyclable' && weight > 5) { // 5kg threshold for single collection bonus
      const bonusAmount = weight * 2; // 2 LKR per kg bonus
      discounts.push({
        type: 'recycling_bonus',
        description: `Recycling bonus for ${weight.toFixed(1)}kg recyclable waste`,
        percentage: 0,
        amount: bonusAmount
      });
    }

    const discountAmount = discounts.reduce((sum, discount) => sum + discount.amount, 0);
    
    // Calculate tax
    const taxRate = rates.taxRate;
    const taxableAmount = subtotal + penaltyAmount - discountAmount;
    const taxAmount = Math.max(0, taxableAmount * taxRate);
    
    const totalAmount = subtotal + taxAmount + penaltyAmount - discountAmount;

    return {
      chargeBreakdown: {
        baseRate: 0, // No base rate for per-collection billing
        wasteCharges,
        additionalServices: [],
        penalties,
        discounts
      },
      totals: {
        subtotal,
        taxAmount,
        discountAmount,
        penaltyAmount,
        totalAmount: Math.max(0, totalAmount),
        currency: 'LKR'
      }
    };
  }

  // Calculate penalties for a single collection
  static calculateCollectionPenalties(collection) {
    const penalties = [];
    const wasteData = collection.wasteData;
    
    // Contamination penalty
    if (wasteData?.contaminated) {
      penalties.push({
        type: 'contamination',
        description: `Contamination penalty for bin ${collection.wasteBin.binId}`,
        amount: PENALTIES.contamination
      });
    }
    
    // Overweight penalty
    if (collection.wasteBin?.capacity && wasteData?.weight) {
      const maxWeight = collection.wasteBin.capacity.total * 0.8; // 80% of capacity
      if (wasteData.weight > maxWeight) {
        const overweight = wasteData.weight - maxWeight;
        penalties.push({
          type: 'overweight',
          description: `Overweight penalty: ${overweight.toFixed(1)}kg over limit`,
          amount: overweight * PENALTIES.overweight
        });
      }
    }
    
    return penalties;
  }

  // Get billing period dates (kept for legacy support)
  static getBillingPeriod(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return { startDate, endDate };
  }

  // Get previous billing period (kept for legacy support)
  static getPreviousBillingPeriod(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    return { startDate, endDate };
  }

  // Calculate charges for collections
  static calculateWasteCharges(collections, userType) {
    const rates = BILLING_RATES[userType].wasteRates;
    const wasteCharges = [];
    let totalWeight = 0;
    
    collections.forEach(collection => {
      if (collection.status === 'completed' && collection.wasteData) {
        const weight = collection.wasteData.weight || 0;
        const wasteType = collection.wasteData.wasteType || 'general';
        const rate = rates[wasteType] || rates.general;
        const amount = weight * rate;
        
        totalWeight += weight;
        
        wasteCharges.push({
          binId: collection.wasteBin._id || collection.wasteBin,
          wasteType,
          weight,
          volume: collection.wasteData.volume || 0,
          rate,
          amount
        });
      }
    });
    
    return { wasteCharges, totalWeight };
  }

  // Calculate recycling bonus
  static calculateRecyclingBonus(collections, userType) {
    const config = BILLING_RATES[userType].recyclingBonus;
    let recyclableWeight = 0;
    
    collections.forEach(collection => {
      if (collection.status === 'completed' && 
          collection.wasteData?.wasteType === 'recyclable') {
        recyclableWeight += collection.wasteData.weight || 0;
      }
    });
    
    if (recyclableWeight > config.threshold) {
      const bonusWeight = recyclableWeight - config.threshold;
      const bonusAmount = bonusWeight * config.bonusRate;
      
      return {
        type: 'recycling_bonus',
        description: `Recycling bonus for ${bonusWeight.toFixed(1)}kg above ${config.threshold}kg threshold`,
        percentage: 0,
        amount: bonusAmount
      };
    }
    
    return null;
  }

  // Calculate volume discount for businesses
  static calculateVolumeDiscount(totalWeight, subtotal, userType) {
    if (userType !== 'business') return null;
    
    const config = BILLING_RATES[userType].volumeDiscount;
    if (totalWeight > config.threshold) {
      const discountAmount = subtotal * config.discountRate;
      
      return {
        type: 'volume_discount',
        description: `Volume discount for ${totalWeight.toFixed(1)}kg (above ${config.threshold}kg)`,
        percentage: config.discountRate * 100,
        amount: discountAmount
      };
    }
    
    return null;
  }

  // Calculate penalties
  static calculatePenalties(collections, user) {
    const penalties = [];
    
    collections.forEach(collection => {
      // Contamination penalty
      if (collection.wasteData?.contaminated) {
        penalties.push({
          type: 'contamination',
          description: `Contamination penalty for bin ${collection.wasteBin.binId || collection.wasteBin}`,
          amount: PENALTIES.contamination
        });
      }
      
      // Overweight penalty
      if (collection.wasteBin?.capacity && collection.wasteData?.weight) {
        const maxWeight = collection.wasteBin.capacity.total * 0.8; // 80% of capacity
        if (collection.wasteData.weight > maxWeight) {
          const overweight = collection.wasteData.weight - maxWeight;
          penalties.push({
            type: 'overweight',
            description: `Overweight penalty: ${overweight.toFixed(1)}kg over limit`,
            amount: overweight * PENALTIES.overweight
          });
        }
      }
    });
    
    return penalties;
  }

  // Generate bill for a user
  static async generateBill(userId, billingPeriod = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!['resident', 'business'].includes(user.userType)) {
        throw new Error('Billing only available for residents and businesses');
      }

      const period = billingPeriod || this.getPreviousBillingPeriod();
      
      // Check if bill already exists for this period
      const existingBill = await Payment.findOne({
        user: userId,
        'billingPeriod.startDate': period.startDate,
        'billingPeriod.endDate': period.endDate
      });

      if (existingBill) {
        console.log(`Bill already exists for user ${userId} for period ${period.startDate} - ${period.endDate}`);
        return existingBill;
      }

      // Get collections for the billing period
      const collections = await Collection.find({
        status: 'completed',
        actualCollectionDate: {
          $gte: period.startDate,
          $lte: period.endDate
        }
      }).populate([
        {
          path: 'wasteBin',
          match: { owner: userId }
        }
      ]);

      // Filter collections that belong to this user
      const userCollections = collections.filter(c => c.wasteBin);

      if (userCollections.length === 0) {
        console.log(`No completed collections found for user ${userId} in period ${period.startDate} - ${period.endDate}`);
        return null;
      }

      // Calculate charges
      const baseRate = BILLING_RATES[user.userType].baseRate;
      const { wasteCharges, totalWeight } = this.calculateWasteCharges(userCollections, user.userType);
      const penalties = this.calculatePenalties(userCollections, user);

      // Calculate subtotal
      let subtotal = baseRate;
      wasteCharges.forEach(charge => subtotal += charge.amount);

      // Calculate discounts
      const discounts = [];
      
      const recyclingBonus = this.calculateRecyclingBonus(userCollections, user.userType);
      if (recyclingBonus) discounts.push(recyclingBonus);
      
      const volumeDiscount = this.calculateVolumeDiscount(totalWeight, subtotal, user.userType);
      if (volumeDiscount) discounts.push(volumeDiscount);

      // Calculate totals
      const penaltyAmount = penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
      const discountAmount = discounts.reduce((sum, discount) => sum + discount.amount, 0);
      const taxRate = BILLING_RATES[user.userType].taxRate;
      const taxAmount = (subtotal + penaltyAmount - discountAmount) * taxRate;
      const totalAmount = subtotal + taxAmount + penaltyAmount - discountAmount;

      // Create payment record
      const payment = new Payment({
        user: userId,
        billingPeriod: period,
        collections: userCollections.map(c => c._id),
        charges: {
          baseRate,
          wasteCharges,
          additionalServices: [],
          penalties,
          discounts
        },
        totals: {
          subtotal,
          taxAmount,
          discountAmount,
          penaltyAmount,
          totalAmount: Math.max(0, totalAmount), // Ensure non-negative
          currency: 'LKR'
        },
        paymentDetails: {
          method: 'credit_card' // Default method
        },
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: {
          systemNotes: `Auto-generated bill for ${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]}`
        }
      });

      await payment.save();
      
      console.log(`Generated bill ${payment.invoiceNumber} for user ${user.email}: LKR ${totalAmount.toFixed(2)}`);
      return payment;

    } catch (error) {
      console.error('Error generating bill:', error);
      throw error;
    }
  }

  // Generate bills for all users
  static async generateBillsForAllUsers(billingPeriod = null) {
    try {
      const period = billingPeriod || this.getPreviousBillingPeriod();
      console.log(`Generating bills for period: ${period.startDate} to ${period.endDate}`);

      const users = await User.find({
        userType: { $in: ['resident', 'business'] },
        accountStatus: 'active'
      });

      const results = {
        success: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      for (const user of users) {
        try {
          const bill = await this.generateBill(user._id, period);
          if (bill) {
            results.success++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            userId: user._id,
            email: user.email,
            error: error.message
          });
          console.error(`Failed to generate bill for user ${user.email}:`, error.message);
        }
      }

      console.log(`Billing generation complete:`, results);
      return results;

    } catch (error) {
      console.error('Error in generateBillsForAllUsers:', error);
      throw error;
    }
  }

  // Manual bill generation with custom charges
  static async generateManualBill(userId, billingData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const payment = new Payment({
        user: userId,
        billingPeriod: billingData.billingPeriod,
        collections: billingData.collections || [],
        charges: billingData.charges,
        totals: billingData.totals,
        paymentDetails: {
          method: 'credit_card'
        },
        status: 'pending',
        dueDate: billingData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: {
          adminNotes: billingData.notes || 'Manually generated bill'
        }
      });

      await payment.save();
      console.log(`Manual bill ${payment.invoiceNumber} generated for user ${user.email}`);
      return payment;

    } catch (error) {
      console.error('Error generating manual bill:', error);
      throw error;
    }
  }
}

module.exports = BillingService;