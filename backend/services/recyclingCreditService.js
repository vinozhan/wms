const RecyclingCredit = require('../models/RecyclingCredit');
const Collection = require('../models/Collection');
const User = require('../models/User');
const BillingRate = require('../models/BillingRate');
const Payment = require('../models/Payment');

class RecyclingCreditService {

  static async processCollectionForCredits(collectionId, verifierId) {
    try {
      const collection = await Collection.findById(collectionId)
        .populate('requester')
        .populate('wasteBin');

      if (!collection) {
        throw new Error('Collection not found');
      }

      if (!['recyclable', 'electronic', 'organic', 'hazardous'].includes(collection.wasteData.wasteType)) {
        throw new Error('Waste type not eligible for recycling credits');
      }

      // Check if credits already processed for this collection
      const existingCredit = await RecyclingCredit.findOne({ collection: collectionId });
      if (existingCredit) {
        throw new Error('Credits already processed for this collection');
      }

      // Get billing rate for credit calculation
      const billingRate = await BillingRate.findOne({
        district: collection.requester.address.city,
        isActive: true,
        'recyclingIncentives.enabled': true
      });

      if (!billingRate) {
        throw new Error('No active recycling incentive program found for this district');
      }

      // Assess waste quality
      const qualityAssessment = this.assessWasteQuality(collection);

      // Create recycling credit record
      const recyclingCredit = new RecyclingCredit({
        user: collection.requester._id,
        collection: collection._id,
        wasteType: collection.wasteData.wasteType,
        subType: this.determineSubType(collection),
        weight: collection.wasteData.weight || 0,
        volume: collection.wasteData.volume || 0,
        quality: qualityAssessment.quality,
        qualityScore: qualityAssessment.score,
        verification: {
          method: 'visual_inspection',
          verifiedBy: verifierId,
          verificationDate: new Date(),
          photos: [], // Would be populated from collection verification
          notes: qualityAssessment.notes,
          confidence: qualityAssessment.confidence
        },
        creditCalculation: {
          baseRate: 0, // Will be calculated
          qualityMultiplier: 0, // Will be calculated
          bonusMultipliers: this.calculateBonusMultipliers(collection, billingRate),
          grossCredits: 0,
          deductions: this.calculateDeductions(collection, qualityAssessment),
          netCredits: 0
        },
        monetaryValue: {
          creditValue: 0,
          exchangeRate: this.getCreditExchangeRate(collection.wasteData.wasteType, billingRate),
          monetaryAmount: 0,
          currency: 'LKR'
        },
        location: {
          collectionPoint: collection.wasteBin.location.address,
          coordinates: collection.wasteBin.location.coordinates,
          district: collection.requester.address.city,
          city: collection.requester.address.city
        },
        metadata: {
          seasonalBonus: this.getSeasonalBonus(),
          campaignBonus: 0, // Would be set if there's an active campaign
          milestoneBonus: await this.calculateMilestoneBonus(collection.requester._id),
          loyaltyTier: await this.getUserLoyaltyTier(collection.requester._id),
          tags: this.generateTags(collection),
          notes: ''
        }
      });

      // Calculate credits
      const netCredits = recyclingCredit.calculateCredits(billingRate);
      recyclingCredit.creditCalculation.netCredits = netCredits;
      recyclingCredit.monetaryValue.creditValue = netCredits;

      // Save the credit record
      await recyclingCredit.save();

      // Update user's credit balance (if user has a credit balance field)
      await this.updateUserCreditBalance(collection.requester._id, netCredits);

      return {
        creditId: recyclingCredit.creditId,
        creditsEarned: netCredits,
        monetaryValue: recyclingCredit.monetaryValue.monetaryAmount,
        environmentalImpact: recyclingCredit.environmental,
        qualityRating: qualityAssessment.quality,
        verificationStatus: 'verified'
      };

    } catch (error) {
      console.error('Error processing recycling credits:', error);
      throw error;
    }
  }

  static assessWasteQuality(collection) {
    let quality = 'good';
    let score = 80;
    let notes = '';
    let confidence = 90;

    // Check for contamination
    if (collection.wasteData.contamination?.detected) {
      switch (collection.wasteData.contamination.level) {
        case 'high':
          quality = 'contaminated';
          score = 20;
          break;
        case 'medium':
          quality = 'poor';
          score = 40;
          break;
        case 'low':
          quality = 'fair';
          score = 60;
          break;
      }
      notes += `Contamination detected: ${collection.wasteData.contamination.description}. `;
      confidence = 85;
    }

    // Bonus for clean recyclables
    if (collection.wasteData.wasteType === 'recyclable' && !collection.wasteData.contamination?.detected) {
      if (score >= 80) {
        quality = 'excellent';
        score = 95;
        notes += 'Clean, well-sorted recyclable material. ';
        confidence = 95;
      }
    }

    // Electronic waste quality assessment
    if (collection.wasteData.wasteType === 'electronic') {
      // Assume higher value for working electronics
      if (score >= 70) {
        quality = 'good';
        score = 85;
        notes += 'Electronic waste in good condition. ';
      }
    }

    return {
      quality,
      score,
      notes: notes.trim(),
      confidence
    };
  }

  static determineSubType(collection) {
    // This would normally use AI or manual categorization
    // For now, return defaults based on waste type
    const subTypeMap = {
      recyclable: 'plastic_bottles',
      electronic: 'smartphone',
      organic: 'food_waste',
      hazardous: 'chemical_waste'
    };

    return subTypeMap[collection.wasteData.wasteType] || 'default';
  }

  static calculateBonusMultipliers(collection, billingRate) {
    const bonuses = [];

    // Volume bonus for large collections
    if (collection.wasteData.weight > 10) {
      bonuses.push({
        type: 'volume_bonus',
        multiplier: 1.2,
        reason: 'Large volume collection bonus'
      });
    }

    // Clean sorting bonus
    if (!collection.wasteData.contamination?.detected) {
      bonuses.push({
        type: 'clean_sorting_bonus',
        multiplier: 1.1,
        reason: 'Clean, well-sorted materials'
      });
    }

    // Rare material bonus for electronics
    if (collection.wasteData.wasteType === 'electronic') {
      bonuses.push({
        type: 'rare_material_bonus',
        multiplier: 1.3,
        reason: 'Rare earth materials recovery'
      });
    }

    return bonuses;
  }

  static calculateDeductions(collection, qualityAssessment) {
    const deductions = [];

    if (collection.wasteData.contamination?.detected) {
      const deductionAmounts = {
        low: 0.5,
        medium: 1.0,
        high: 2.0
      };

      const level = collection.wasteData.contamination.level || 'low';
      deductions.push({
        reason: 'contamination',
        amount: deductionAmounts[level] * (collection.wasteData.weight || 1),
        description: `Contamination penalty: ${level} level`
      });
    }

    return deductions;
  }

  static getCreditExchangeRate(wasteType, billingRate) {
    const incentiveRate = billingRate.recyclingIncentives.rates.find(
      r => r.wasteType === wasteType
    );

    if (incentiveRate) {
      return incentiveRate.creditRate;
    }

    // Default rates per credit
    const defaultRates = {
      electronic: 2.0, // 2 LKR per credit
      recyclable: 1.0,
      organic: 0.5,
      hazardous: 3.0
    };

    return defaultRates[wasteType] || 1.0;
  }

  static getSeasonalBonus() {
    const now = new Date();
    const month = now.getMonth();

    // Earth Day month (April) bonus
    if (month === 3) {
      return 1.2;
    }

    // World Environment Day month (June) bonus
    if (month === 5) {
      return 1.15;
    }

    return 1.0;
  }

  static async calculateMilestoneBonus(userId) {
    const userCredits = await RecyclingCredit.countDocuments({
      user: userId,
      status: { $in: ['verified', 'credited'] }
    });

    // Milestone bonuses
    if (userCredits >= 100) return 1.5; // 100+ credits
    if (userCredits >= 50) return 1.3;  // 50+ credits  
    if (userCredits >= 25) return 1.2;  // 25+ credits
    if (userCredits >= 10) return 1.1;  // 10+ credits

    return 1.0;
  }

  static async getUserLoyaltyTier(userId) {
    const totalCredits = await RecyclingCredit.aggregate([
      { $match: { user: userId, status: { $in: ['verified', 'credited'] } } },
      { $group: { _id: null, total: { $sum: '$creditCalculation.netCredits' } } }
    ]);

    const credits = totalCredits[0]?.total || 0;

    if (credits >= 1000) return 'platinum';
    if (credits >= 500) return 'gold';
    if (credits >= 250) return 'silver';
    return 'bronze';
  }

  static generateTags(collection) {
    const tags = [];

    if (collection.wasteData.weight > 20) tags.push('bulk_collection');
    if (!collection.wasteData.contamination?.detected) tags.push('clean_sorted');
    if (collection.wasteData.wasteType === 'electronic') tags.push('e_waste');
    if (collection.verification?.method === 'rfid_scan') tags.push('verified_collection');

    return tags;
  }

  static async updateUserCreditBalance(userId, creditsEarned) {
    // This would update a user's credit balance field if it exists
    // For now, we'll just track it in the RecyclingCredit collection
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'creditBalance': creditsEarned }
      });
    } catch (error) {
      console.error('Failed to update user credit balance:', error);
      // Don't throw error as this is not critical
    }
  }

  static async getUserCreditSummary(userId, period = 'monthly') {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      const pipeline = [
        {
          $match: {
            user: userId,
            status: { $in: ['verified', 'credited'] },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$creditCalculation.netCredits' },
            totalMonetaryValue: { $sum: '$monetaryValue.monetaryAmount' },
            totalWeight: { $sum: '$weight' },
            totalCarbonReduction: { $sum: '$environmental.carbonFootprintReduction' },
            totalEnergyS saved: { $sum: '$environmental.energySaved' },
            totalWaterSaved: { $sum: '$environmental.waterSaved' },
            collections: { $sum: 1 },
            byWasteType: {
              $push: {
                wasteType: '$wasteType',
                credits: '$creditCalculation.netCredits',
                weight: '$weight'
              }
            }
          }
        }
      ];

      const result = await RecyclingCredit.aggregate(pipeline);
      const summary = result[0] || {
        totalCredits: 0,
        totalMonetaryValue: 0,
        totalWeight: 0,
        totalCarbonReduction: 0,
        totalEnergySaved: 0,
        totalWaterSaved: 0,
        collections: 0,
        byWasteType: []
      };

      // Calculate waste type breakdown
      const wasteTypeBreakdown = summary.byWasteType.reduce((acc, item) => {
        if (!acc[item.wasteType]) {
          acc[item.wasteType] = { credits: 0, weight: 0, count: 0 };
        }
        acc[item.wasteType].credits += item.credits;
        acc[item.wasteType].weight += item.weight;
        acc[item.wasteType].count += 1;
        return acc;
      }, {});

      // Get user's current loyalty tier
      const loyaltyTier = await this.getUserLoyaltyTier(userId);

      return {
        userId,
        period: {
          type: period,
          start: startDate,
          end: endDate
        },
        summary: {
          totalCredits: summary.totalCredits,
          totalMonetaryValue: summary.totalMonetaryValue,
          totalCollections: summary.collections,
          totalWeight: summary.totalWeight,
          averageCreditsPerCollection: summary.collections > 0 ? 
            summary.totalCredits / summary.collections : 0,
          averageCreditsPerKg: summary.totalWeight > 0 ? 
            summary.totalCredits / summary.totalWeight : 0
        },
        environmental: {
          carbonReduction: summary.totalCarbonReduction,
          energySaved: summary.totalEnergySaved,
          waterSaved: summary.totalWaterSaved,
          equivalentTrees: Math.floor(summary.totalCarbonReduction / 20) // Rough estimate
        },
        wasteTypeBreakdown,
        loyaltyTier,
        achievements: await this.getUserAchievements(userId),
        nextMilestone: this.getNextMilestone(summary.totalCredits)
      };

    } catch (error) {
      console.error('Error getting user credit summary:', error);
      throw error;
    }
  }

  static async processCredit Payout(creditId, paymentMethod, processedBy) {
    try {
      const credit = await RecyclingCredit.findById(creditId).populate('user');

      if (!credit) {
        throw new Error('Recycling credit not found');
      }

      if (credit.status !== 'verified') {
        throw new Error('Credit must be verified before payout');
      }

      // Process the credit
      await credit.processCredit(paymentMethod, processedBy);

      // Create payment record if needed
      if (paymentMethod !== 'account_credit') {
        await this.createCreditPayment(credit);
      }

      return {
        creditId: credit.creditId,
        paymentMethod,
        paymentAmount: credit.monetaryValue.monetaryAmount,
        paymentReference: credit.processing.paymentReference,
        status: 'completed'
      };

    } catch (error) {
      console.error('Error processing credit payout:', error);
      throw error;
    }
  }

  static async createCreditPayment(credit) {
    const payment = new Payment({
      user: credit.user,
      billingPeriod: {
        startDate: credit.createdAt,
        endDate: credit.createdAt
      },
      collections: [credit.collection],
      charges: {
        baseRate: 0,
        wasteCharges: [],
        additionalServices: [],
        penalties: [],
        discounts: [{
          type: 'recycling_bonus',
          description: `Recycling credit payout - ${credit.creditId}`,
          percentage: 0,
          amount: credit.monetaryValue.monetaryAmount
        }]
      },
      totals: {
        subtotal: 0,
        taxAmount: 0,
        discountAmount: credit.monetaryValue.monetaryAmount,
        penaltyAmount: 0,
        totalAmount: -credit.monetaryValue.monetaryAmount, // Negative for credit
        currency: 'LKR'
      },
      paymentDetails: {
        method: credit.processing.paymentMethod,
        transactionId: credit.processing.paymentReference,
        reference: `Recycling Credit Payout - ${credit.creditId}`
      },
      status: 'completed',
      paymentDate: new Date(),
      dueDate: new Date()
    });

    return payment.save();
  }

  static async getUserAchievements(userId) {
    const achievements = [];
    
    const totalCredits = await RecyclingCredit.countDocuments({
      user: userId,
      status: { $in: ['verified', 'credited'] }
    });

    // Credit milestones
    if (totalCredits >= 100) achievements.push('Eco Champion');
    if (totalCredits >= 50) achievements.push('Green Warrior');
    if (totalCredits >= 25) achievements.push('Earth Friend');
    if (totalCredits >= 10) achievements.push('Recycling Starter');

    // Consistency achievements
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCredits = await RecyclingCredit.countDocuments({
      user: userId,
      status: { $in: ['verified', 'credited'] },
      createdAt: { $gte: last30Days }
    });

    if (recentCredits >= 10) achievements.push('Consistent Recycler');

    // Waste type diversity
    const wasteTypes = await RecyclingCredit.distinct('wasteType', {
      user: userId,
      status: { $in: ['verified', 'credited'] }
    });

    if (wasteTypes.length >= 3) achievements.push('Waste Sorting Expert');
    if (wasteTypes.includes('electronic')) achievements.push('E-Waste Hero');
    if (wasteTypes.includes('hazardous')) achievements.push('Hazmat Handler');

    return achievements;
  }

  static getNextMilestone(currentCredits) {
    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    
    for (const milestone of milestones) {
      if (currentCredits < milestone) {
        return {
          target: milestone,
          remaining: milestone - currentCredits,
          progress: (currentCredits / milestone) * 100
        };
      }
    }

    return {
      target: 'Max Level',
      remaining: 0,
      progress: 100
    };
  }

  static getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  static async generateCreditReport(districtOrUserId, period = 'monthly') {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      let matchCondition = {
        status: { $in: ['verified', 'credited'] },
        createdAt: { $gte: startDate, $lte: endDate }
      };

      // Determine if it's a district or user query
      if (mongoose.Types.ObjectId.isValid(districtOrUserId)) {
        matchCondition.user = districtOrUserId;
      } else {
        matchCondition['location.district'] = districtOrUserId;
      }

      const pipeline = [
        { $match: matchCondition },
        {
          $group: {
            _id: {
              wasteType: '$wasteType',
              month: { $month: '$createdAt' }
            },
            totalCredits: { $sum: '$creditCalculation.netCredits' },
            totalMonetaryValue: { $sum: '$monetaryValue.monetaryAmount' },
            totalWeight: { $sum: '$weight' },
            collections: { $sum: 1 },
            avgQualityScore: { $avg: '$qualityScore' },
            carbonReduction: { $sum: '$environmental.carbonFootprintReduction' },
            energySaved: { $sum: '$environmental.energySaved' },
            waterSaved: { $sum: '$environmental.waterSaved' }
          }
        },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$totalCredits' },
            totalMonetaryValue: { $sum: '$totalMonetaryValue' },
            totalWeight: { $sum: '$totalWeight' },
            totalCollections: { $sum: '$collections' },
            avgQualityScore: { $avg: '$avgQualityScore' },
            totalCarbonReduction: { $sum: '$carbonReduction' },
            totalEnergySaved: { $sum: '$energySaved' },
            totalWaterSaved: { $sum: '$waterSaved' },
            byWasteType: {
              $push: {
                wasteType: '$_id.wasteType',
                month: '$_id.month',
                credits: '$totalCredits',
                collections: '$collections',
                weight: '$totalWeight'
              }
            }
          }
        }
      ];

      const result = await RecyclingCredit.aggregate(pipeline);
      
      return {
        period: { type: period, start: startDate, end: endDate },
        summary: result[0] || {},
        generatedAt: new Date(),
        reportType: mongoose.Types.ObjectId.isValid(districtOrUserId) ? 'user' : 'district'
      };

    } catch (error) {
      console.error('Error generating credit report:', error);
      throw error;
    }
  }
}

module.exports = RecyclingCreditService;