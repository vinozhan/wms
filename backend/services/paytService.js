const BillingRate = require('../models/BillingRate');
const Payment = require('../models/Payment');
const Collection = require('../models/Collection');
const WasteBin = require('../models/WasteBin');
const User = require('../models/User');

class PAYTService {
  
  static async calculateBill(userId, billingPeriod, options = {}) {
    try {
      const user = await User.findById(userId).populate('wasteBins');
      if (!user) {
        throw new Error('User not found');
      }

      // Get active billing rate for user's district
      const billingRate = await BillingRate.findOne({
        district: user.address.city,
        isActive: true,
        effectiveFrom: { $lte: billingPeriod.endDate },
        $or: [
          { effectiveTo: null },
          { effectiveTo: { $gte: billingPeriod.startDate } }
        ]
      });

      if (!billingRate) {
        throw new Error(`No active billing rate found for district: ${user.address.city}`);
      }

      // Fetch collections for the billing period
      const collections = await Collection.find({
        requester: userId,
        actualCollectionDate: {
          $gte: billingPeriod.startDate,
          $lte: billingPeriod.endDate
        },
        status: 'completed'
      }).populate('wasteBin');

      // Prepare waste data for billing calculation
      const wasteData = {
        collections: collections.map(collection => ({
          collectionId: collection._id,
          wasteType: collection.wasteData.wasteType,
          weight: collection.wasteData.weight || 0,
          volume: collection.wasteData.volume || 0,
          quality: collection.wasteData.contamination?.detected ? 'contaminated' : 'clean',
          collectionDate: collection.actualCollectionDate
        })),
        specialServices: collections
          .filter(c => c.wasteData.wasteType === 'bulk' || c.wasteData.wasteType === 'hazardous')
          .map(c => ({
            type: c.wasteData.wasteType === 'bulk' ? 'bulk_collection' : 'hazardous_disposal',
            quantity: 1,
            collectionId: c._id
          }))
      };

      // Calculate base cost
      let billCalculation = billingRate.calculateCost(wasteData);

      // Apply discounts if specified
      if (options.discounts && options.discounts.length > 0) {
        billCalculation = billingRate.applyDiscounts(billCalculation, options.discounts);
      }

      // Apply penalties if specified
      if (options.penalties && options.penalties.length > 0) {
        billCalculation = billingRate.applyPenalties(billCalculation, options.penalties);
      }

      // Calculate tax
      const taxAmount = billCalculation.netAmount * billingRate.taxConfiguration.taxRate;

      const finalCalculation = {
        ...billCalculation,
        taxAmount,
        finalAmount: billCalculation.netAmount + taxAmount,
        billingRate: billingRate._id,
        billingModel: billingRate.billingModel,
        currency: 'LKR'
      };

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          address: user.address,
          userType: user.userType
        },
        billingPeriod,
        collections: wasteData.collections,
        specialServices: wasteData.specialServices,
        calculation: finalCalculation,
        billingRate: {
          id: billingRate._id,
          name: billingRate.name,
          model: billingRate.billingModel,
          district: billingRate.district
        }
      };

    } catch (error) {
      console.error('Error calculating PAYT bill:', error);
      throw error;
    }
  }

  static async generateInvoice(billData, options = {}) {
    try {
      const paymentData = {
        user: billData.user.id,
        billingPeriod: billData.billingPeriod,
        collections: billData.collections.map(c => c.collectionId),
        charges: {
          baseRate: billData.calculation.breakdown.baseRate,
          wasteCharges: billData.collections.map(collection => ({
            binId: collection.binId, // This would need to be added to collection data
            wasteType: collection.wasteType,
            weight: collection.weight,
            volume: collection.volume,
            rate: this.calculateItemRate(collection, billData.billingRate),
            amount: this.calculateItemAmount(collection, billData.billingRate)
          })),
          additionalServices: billData.specialServices.map(service => ({
            service: service.type,
            description: `${service.type.replace('_', ' ')} service`,
            rate: this.getServiceRate(service.type, billData.billingRate),
            amount: this.getServiceAmount(service, billData.billingRate)
          })),
          penalties: options.penalties || [],
          discounts: options.discounts || []
        },
        totals: {
          subtotal: billData.calculation.subtotal,
          taxAmount: billData.calculation.taxAmount,
          discountAmount: billData.calculation.discountAmount || 0,
          penaltyAmount: billData.calculation.penaltyAmount || 0,
          totalAmount: billData.calculation.finalAmount,
          currency: billData.calculation.currency
        },
        paymentDetails: {
          method: 'pending',
        },
        status: 'pending',
        dueDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
        recyclingCredits: {
          earnedCredits: billData.calculation.recyclingCredits || 0,
          usedCredits: 0,
          creditRate: this.getCreditRate(billData.billingRate),
          creditAmount: (billData.calculation.recyclingCredits || 0) * this.getCreditRate(billData.billingRate)
        }
      };

      const payment = new Payment(paymentData);
      await payment.save();

      return payment;

    } catch (error) {
      console.error('Error generating PAYT invoice:', error);
      throw error;
    }
  }

  static async getWasteStatistics(userId, period = 'monthly') {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      const collections = await Collection.find({
        requester: userId,
        actualCollectionDate: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
      });

      const statistics = {
        totalCollections: collections.length,
        totalWeight: collections.reduce((sum, c) => sum + (c.wasteData.weight || 0), 0),
        totalVolume: collections.reduce((sum, c) => sum + (c.wasteData.volume || 0), 0),
        wasteByType: this.groupByWasteType(collections),
        recyclingRate: this.calculateRecyclingRate(collections),
        environmentalImpact: await this.calculateEnvironmentalImpact(collections),
        costSavings: await this.calculateCostSavings(userId, collections),
        period: {
          start: startDate,
          end: endDate,
          type: period
        }
      };

      return statistics;

    } catch (error) {
      console.error('Error getting waste statistics:', error);
      throw error;
    }
  }

  static async optimizeBillingRecommendations(userId) {
    try {
      const user = await User.findById(userId);
      const recentStats = await this.getWasteStatistics(userId, 'monthly');
      const billingRate = await BillingRate.findOne({
        district: user.address.city,
        isActive: true
      });

      const recommendations = [];

      // Analyze waste patterns
      if (recentStats.recyclingRate < 0.3) {
        recommendations.push({
          type: 'recycling_improvement',
          title: 'Improve Recycling Rate',
          description: 'Increase recycling to earn more credits and reduce costs',
          potentialSavings: recentStats.totalWeight * 0.2 * 5, // Estimated savings
          difficulty: 'easy',
          impact: 'medium'
        });
      }

      // Check for optimal collection frequency
      if (recentStats.totalWeight / recentStats.totalCollections < 5) {
        recommendations.push({
          type: 'collection_frequency',
          title: 'Optimize Collection Frequency',
          description: 'Consider reducing collection frequency to minimize base fees',
          potentialSavings: billingRate.rates.baseRate.amount * 0.3,
          difficulty: 'medium',
          impact: 'high'
        });
      }

      // Volume vs Weight analysis
      const avgDensity = recentStats.totalWeight / recentStats.totalVolume;
      if (avgDensity > 0.5 && billingRate.billingModel === 'volume_based') {
        recommendations.push({
          type: 'billing_model',
          title: 'Consider Weight-Based Billing',
          description: 'Your waste density suggests weight-based billing might be more economical',
          potentialSavings: 'Contact admin for estimate',
          difficulty: 'hard',
          impact: 'high'
        });
      }

      return {
        userId,
        generatedAt: new Date(),
        currentStats: recentStats,
        recommendations,
        projectedMonthlySavings: recommendations.reduce((sum, r) => 
          sum + (typeof r.potentialSavings === 'number' ? r.potentialSavings : 0), 0
        )
      };

    } catch (error) {
      console.error('Error generating billing recommendations:', error);
      throw error;
    }
  }

  // Helper methods
  static calculateItemRate(collection, billingRate) {
    // Implementation would depend on billing rate structure
    return 0; // Placeholder
  }

  static calculateItemAmount(collection, billingRate) {
    // Implementation would depend on billing rate structure
    return 0; // Placeholder
  }

  static getServiceRate(serviceType, billingRate) {
    // Implementation would look up service rate
    return 0; // Placeholder
  }

  static getServiceAmount(service, billingRate) {
    // Implementation would calculate service amount
    return 0; // Placeholder
  }

  static getCreditRate(billingRate) {
    return billingRate.recyclingIncentives.rates[0]?.creditRate || 0;
  }

  static getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'weekly':
        return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarterly':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterStart, 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }
  }

  static groupByWasteType(collections) {
    return collections.reduce((acc, collection) => {
      const type = collection.wasteData.wasteType;
      if (!acc[type]) {
        acc[type] = { count: 0, weight: 0, volume: 0 };
      }
      acc[type].count++;
      acc[type].weight += collection.wasteData.weight || 0;
      acc[type].volume += collection.wasteData.volume || 0;
      return acc;
    }, {});
  }

  static calculateRecyclingRate(collections) {
    const recyclableCollections = collections.filter(c => 
      ['recyclable', 'organic', 'electronic'].includes(c.wasteData.wasteType)
    );
    return collections.length > 0 ? recyclableCollections.length / collections.length : 0;
  }

  static async calculateEnvironmentalImpact(collections) {
    // Placeholder for environmental impact calculation
    const totalWeight = collections.reduce((sum, c) => sum + (c.wasteData.weight || 0), 0);
    return {
      carbonFootprintReduction: totalWeight * 0.5, // kg CO2 saved
      energySaved: totalWeight * 2, // kWh equivalent
      waterSaved: totalWeight * 10 // liters saved
    };
  }

  static async calculateCostSavings(userId, collections) {
    // Placeholder for cost savings calculation based on recycling
    const recyclableWeight = collections
      .filter(c => ['recyclable', 'organic', 'electronic'].includes(c.wasteData.wasteType))
      .reduce((sum, c) => sum + (c.wasteData.weight || 0), 0);
    
    return {
      recyclingCredits: recyclableWeight * 2, // LKR saved through credits
      reductionInBaseFees: recyclableWeight * 0.5, // LKR saved on base fees
      totalSavings: (recyclableWeight * 2) + (recyclableWeight * 0.5)
    };
  }
}

module.exports = PAYTService;