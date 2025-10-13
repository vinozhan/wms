const EnvironmentalImpact = require('../models/EnvironmentalImpact');
const Collection = require('../models/Collection');
const WasteBin = require('../models/WasteBin');
const Route = require('../models/Route');
const User = require('../models/User');

class EnvironmentalImpactService {

  static async calculateCollectionImpact(collectionId) {
    try {
      const collection = await Collection.findById(collectionId)
        .populate('wasteBin')
        .populate('collector')
        .populate('requester')
        .populate('route');

      if (!collection) {
        throw new Error('Collection not found');
      }

      // Calculate various environmental impacts
      const carbonFootprint = await this.calculateCarbonFootprint(collection);
      const energyImpact = await this.calculateEnergyImpact(collection);
      const waterImpact = await this.calculateWaterImpact(collection);
      const airQualityImpact = await this.calculateAirQualityImpact(collection);
      const soilLandImpact = await this.calculateSoilLandImpact(collection);
      const biodiversityImpact = await this.calculateBiodiversityImpact(collection);
      const economicImpact = await this.calculateEconomicImpact(collection);
      const socialImpact = await this.calculateSocialImpact(collection);

      // Create environmental impact record
      const environmentalImpact = new EnvironmentalImpact({
        collection: collection._id,
        user: collection.requester._id,
        route: collection.route?._id,
        district: collection.requester.address?.city || 'Unknown',
        reportingPeriod: {
          startDate: collection.actualCollectionDate || collection.scheduledDate,
          endDate: collection.actualCollectionDate || collection.scheduledDate,
          type: 'daily'
        },
        wasteData: {
          totalWeight: collection.wasteData.weight || 0,
          totalVolume: collection.wasteData.volume || 0,
          wasteComposition: this.analyzeWasteComposition(collection),
          divertedFromLandfill: this.calculateDivertedWaste(collection)
        },
        carbonFootprint,
        energyImpact,
        waterImpact,
        airQuality: airQualityImpact,
        soilAndLand: soilLandImpact,
        biodiversity: biodiversityImpact,
        economicImpact,
        socialImpact,
        verification: {
          dataQuality: {
            completeness: this.calculateDataCompleteness(collection),
            accuracy: 95, // Default high accuracy
            reliability: 90
          },
          auditTrail: [{
            action: 'impact_calculated',
            user: collection.collector._id,
            timestamp: new Date(),
            details: 'Environmental impact calculated for collection'
          }]
        },
        predictions: await this.generatePredictions(collection)
      });

      await environmentalImpact.save();

      return {
        impactId: environmentalImpact.impactId,
        collectionId: collection.collectionId,
        summary: environmentalImpact.generateReport(),
        sustainabilityGrade: environmentalImpact.sustainabilityGrade,
        carbonCreditsEligible: environmentalImpact.carbonCreditsEligible
      };

    } catch (error) {
      console.error('Error calculating environmental impact:', error);
      throw error;
    }
  }

  static async calculateCarbonFootprint(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;
    
    // Collection transport emissions
    const distance = collection.route?.optimization?.estimatedDistance || 2; // km estimate
    const fuelConsumption = distance * 0.3; // liters per km
    const transportEmissions = fuelConsumption * 2.3; // kg CO2 per liter diesel

    // Waste processing emissions/savings
    const processingFactors = this.getProcessingEmissionFactors();
    const recyclingEmissions = this.calculateRecyclingImpact(weight, wasteType, processingFactors);
    const landfillEmissions = this.calculateLandfillImpact(weight, wasteType, processingFactors);
    const incinerationEmissions = 0; // Assume no incineration
    const compostingEmissions = this.calculateCompostingImpact(weight, wasteType, processingFactors);

    // Calculate carbon credits eligibility
    const netSavings = Math.abs(recyclingEmissions) + Math.abs(compostingEmissions);
    const carbonCredits = netSavings > 100 ? {
      eligible: true,
      credits: netSavings / 1000, // Convert to tons
      value: (netSavings / 1000) * 25 * 300 // 25 USD per ton * 300 LKR/USD
    } : { eligible: false, credits: 0, value: 0 };

    return {
      collectionTransport: {
        fuelConsumption,
        distance,
        emissions: transportEmissions
      },
      wasteProcessing: {
        recyclingEmissions,
        landfillEmissions,
        incinerationEmissions,
        compostingEmissions
      },
      netCarbonImpact: {
        totalEmissions: transportEmissions + Math.max(0, landfillEmissions),
        totalSavings: Math.abs(recyclingEmissions) + Math.abs(compostingEmissions),
        netImpact: 0 // Will be calculated in the model
      },
      carbonCredits
    };
  }

  static async calculateEnergyImpact(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;
    
    // Collection energy consumption
    const distance = collection.route?.optimization?.estimatedDistance || 2;
    const fuelEnergy = distance * 0.3 * 10; // kWh equivalent (10 kWh per liter)
    const electricityUsed = 0.5; // kWh for bin sensors, scanners, etc.

    // Energy savings from waste processing
    const energyFactors = this.getEnergyFactors();
    const recyclingEnergySaved = this.calculateRecyclingEnergy(weight, wasteType, energyFactors);
    const wasteToEnergyGenerated = wasteType === 'organic' ? weight * 2 : 0; // kWh from biogas

    return {
      collectionEnergy: {
        fuelEnergy,
        electricityUsed,
        totalEnergyConsumed: fuelEnergy + electricityUsed
      },
      energySavings: {
        recyclingEnergySaved,
        wasteToEnergyGenerated,
        totalEnergySaved: recyclingEnergySaved + wasteToEnergyGenerated
      },
      netEnergyImpact: 0, // Calculated in model
      renewableEnergyUsed: electricityUsed * 0.3 // Assume 30% renewable grid
    };
  }

  static async calculateWaterImpact(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;

    // Water usage for collection
    const collectionWaterUse = weight * 0.5; // liters per kg for cleaning
    const processingWaterUse = weight * 1.0; // liters per kg for processing

    // Water savings
    const waterFactors = this.getWaterFactors();
    const recyclingWaterSaved = this.calculateRecyclingWater(weight, wasteType, waterFactors);
    const landfillLeachateAvoided = wasteType === 'organic' ? weight * 5 : weight * 2; // liters

    return {
      collectionWaterUse,
      processingWaterUse,
      waterSavings: {
        recyclingWaterSaved,
        landfillLeachateAvoided,
        totalWaterSaved: recyclingWaterSaved + landfillLeachateAvoided
      },
      netWaterImpact: 0 // Calculated in model
    };
  }

  static async calculateAirQualityImpact(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;

    // Air quality improvements from proper waste management
    const pm25Reduction = this.calculatePMReduction(weight, wasteType, 2.5);
    const pm10Reduction = this.calculatePMReduction(weight, wasteType, 10);
    const methaneReduction = wasteType === 'organic' ? weight * 0.05 : weight * 0.01; // kg CH4
    const nitrousOxideReduction = weight * 0.002; // kg N2O
    const vocReduction = wasteType === 'hazardous' ? weight * 0.1 : weight * 0.01; // kg VOCs

    return {
      particulateMatter: {
        pm25Reduction,
        pm10Reduction
      },
      gasEmissions: {
        methaneReduction,
        nitrousOxideReduction,
        volatileOrganicCompounds: vocReduction
      },
      airQualityIndex: {
        improvement: this.calculateAQIImprovement(pm25Reduction, pm10Reduction)
      }
    };
  }

  static async calculateSoilLandImpact(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;

    const totalDiverted = wasteType !== 'general' ? weight : weight * 0.3;
    const landfillSpaceSaved = totalDiverted / 500; // cubic meters (density assumption)
    const soilContaminationAvoided = wasteType === 'hazardous' ? weight * 10 : weight * 2; // risk score

    const organicWasteComposted = wasteType === 'organic' ? weight : 0;
    const compostProduced = organicWasteComposted * 0.3; // 30% conversion rate
    const soilHealthImprovement = compostProduced / 100; // hectares benefited

    return {
      landfillDiversion: {
        totalDiverted,
        landfillSpaceSaved,
        soilContaminationAvoided
      },
      composting: {
        organicWasteComposted,
        compostProduced,
        soilHealthImprovement
      }
    };
  }

  static async calculateBiodiversityImpact(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;

    const landfillExpansionAvoided = weight / 1000; // hectares
    const naturalResourcesSaved = this.calculateResourcesSaved(weight, wasteType);

    const toxicChemicalReduction = wasteType === 'hazardous' ? weight * 0.8 : weight * 0.1;
    const plasticWasteReduction = wasteType === 'recyclable' ? weight * 0.6 : weight * 0.2;
    const microplasticReduction = plasticWasteReduction * 1000000; // estimated particles

    return {
      habitatProtection: {
        landfillExpansionAvoided,
        naturalResourcesSaved
      },
      pollutionReduction: {
        toxicChemicalReduction,
        plasticWasteReduction,
        microplasticReduction
      }
    };
  }

  static async calculateEconomicImpact(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;

    // Cost savings
    const landfillCostAvoided = weight * 50; // LKR per kg
    const resourceRecoveryValue = this.calculateResourceValue(weight, wasteType);
    const energySavingsValue = weight * 10; // LKR per kg energy equivalent

    // Job creation (fractional for single collection)
    const jobMultiplier = this.getJobMultiplier(wasteType);

    return {
      costSavings: {
        landfillCostAvoided,
        resourceRecoveryValue,
        energySavingsValue,
        totalCostSavings: landfillCostAvoided + resourceRecoveryValue + energySavingsValue
      },
      jobsCreated: {
        recyclingJobs: weight * jobMultiplier.recycling / 1000,
        collectionJobs: 0.001, // Minimal contribution per collection
        processingJobs: weight * jobMultiplier.processing / 1000
      },
      economicMultiplier: 1.2 // Multiplier effect in local economy
    };
  }

  static async calculateSocialImpact(collection) {
    const weight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;

    // Public health improvements
    const diseasePreventionScore = this.calculateHealthScore(weight, wasteType, 'disease');
    const cleanlinessScore = this.calculateHealthScore(weight, wasteType, 'cleanliness');
    const airQualityHealthBenefit = this.calculateHealthScore(weight, wasteType, 'air');

    // Community engagement (would be calculated from user data)
    const participationRate = 85; // Default participation rate
    const awarenessScore = 70; // Default awareness score
    const satisfactionRating = 4.2; // Default satisfaction rating

    return {
      publicHealth: {
        diseasePreventionScore,
        communityCleanlinessScore: cleanlinessScore,
        airQualityHealthBenefit
      },
      communityEngagement: {
        participationRate,
        awarenessScore,
        satisfactionRating
      },
      educationalImpact: {
        outreachPrograms: 0,
        studentsEducated: 0,
        behaviorChangeScore: this.calculateBehaviorChange(collection)
      }
    };
  }

  // Helper methods for calculations

  static getProcessingEmissionFactors() {
    return {
      recyclable: { recycling: -50, landfill: 25 }, // kg CO2 per kg waste
      electronic: { recycling: -100, landfill: 80 },
      organic: { composting: -30, landfill: 45 },
      hazardous: { treatment: -20, landfill: 150 },
      general: { recycling: -20, landfill: 30 }
    };
  }

  static getEnergyFactors() {
    return {
      recyclable: { recycling: 15, landfill: -5 }, // kWh per kg waste
      electronic: { recycling: 30, landfill: -10 },
      organic: { composting: 5, biogas: 20 },
      hazardous: { treatment: 25, landfill: -15 },
      general: { recycling: 8, landfill: -3 }
    };
  }

  static getWaterFactors() {
    return {
      recyclable: { recycling: 25, landfill: -10 }, // liters per kg waste
      electronic: { recycling: 50, landfill: -20 },
      organic: { composting: 15, landfill: -30 },
      hazardous: { treatment: 100, landfill: -50 },
      general: { recycling: 15, landfill: -8 }
    };
  }

  static calculateRecyclingImpact(weight, wasteType, factors) {
    const factor = factors[wasteType]?.recycling || factors.general.recycling;
    return weight * factor;
  }

  static calculateLandfillImpact(weight, wasteType, factors) {
    const factor = factors[wasteType]?.landfill || factors.general.landfill;
    return weight * factor;
  }

  static calculateCompostingImpact(weight, wasteType, factors) {
    if (wasteType === 'organic') {
      return weight * factors.organic.composting;
    }
    return 0;
  }

  static calculateRecyclingEnergy(weight, wasteType, factors) {
    const factor = factors[wasteType]?.recycling || factors.general.recycling;
    return weight * factor;
  }

  static calculateRecyclingWater(weight, wasteType, factors) {
    const factor = factors[wasteType]?.recycling || factors.general.recycling;
    return weight * factor;
  }

  static calculatePMReduction(weight, wasteType, pmSize) {
    const baseFactor = pmSize === 2.5 ? 0.05 : 0.1; // base reduction per kg
    const typeMultiplier = {
      organic: 1.5,
      hazardous: 3.0,
      general: 1.0,
      recyclable: 1.2,
      electronic: 2.0
    };
    
    return weight * baseFactor * (typeMultiplier[wasteType] || 1.0);
  }

  static calculateAQIImprovement(pm25Reduction, pm10Reduction) {
    return Math.sqrt(pm25Reduction * pm25Reduction + pm10Reduction * pm10Reduction) * 0.1;
  }

  static calculateResourcesSaved(weight, wasteType) {
    const resourceFactors = {
      recyclable: 0.8, // resource units per kg
      electronic: 2.0,
      organic: 0.3,
      hazardous: 1.5,
      general: 0.4
    };
    
    return weight * (resourceFactors[wasteType] || 0.4);
  }

  static calculateResourceValue(weight, wasteType) {
    const valueFactors = {
      recyclable: 15, // LKR per kg
      electronic: 50,
      organic: 5,
      hazardous: 30,
      general: 8
    };
    
    return weight * (valueFactors[wasteType] || 8);
  }

  static getJobMultiplier(wasteType) {
    return {
      recyclable: { recycling: 0.05, processing: 0.03 },
      electronic: { recycling: 0.08, processing: 0.05 },
      organic: { recycling: 0.04, processing: 0.02 },
      hazardous: { recycling: 0.10, processing: 0.08 },
      general: { recycling: 0.03, processing: 0.02 }
    }[wasteType] || { recycling: 0.03, processing: 0.02 };
  }

  static calculateHealthScore(weight, wasteType, healthType) {
    const baseScores = {
      disease: { base: 10, multipliers: { organic: 1.5, hazardous: 2.0, general: 1.0 } },
      cleanliness: { base: 15, multipliers: { organic: 1.3, general: 1.0, recyclable: 1.1 } },
      air: { base: 8, multipliers: { hazardous: 2.5, organic: 1.4, general: 1.0 } }
    };

    const config = baseScores[healthType];
    const multiplier = config.multipliers[wasteType] || 1.0;
    
    return weight * config.base * multiplier / 100; // Normalized score
  }

  static calculateBehaviorChange(collection) {
    // Simple behavior change score based on collection compliance
    let score = 50; // Base score
    
    if (collection.status === 'completed') score += 20;
    if (!collection.wasteData.contamination?.detected) score += 15;
    if (collection.wasteData.wasteType !== 'general') score += 10; // Proper sorting
    
    return Math.min(100, score);
  }

  static analyzeWasteComposition(collection) {
    const totalWeight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;
    
    return [{
      wasteType: wasteType,
      weight: totalWeight,
      volume: collection.wasteData.volume || 0,
      percentage: 100
    }];
  }

  static calculateDivertedWaste(collection) {
    const totalWeight = collection.wasteData.weight || 0;
    const wasteType = collection.wasteData.wasteType;
    
    // Assume proper waste types are diverted from landfill
    const diversionRates = {
      recyclable: 0.9,
      electronic: 0.85,
      organic: 0.8,
      hazardous: 1.0,
      general: 0.1
    };
    
    const diversionRate = diversionRates[wasteType] || 0.1;
    const divertedWeight = totalWeight * diversionRate;
    
    return {
      weight: divertedWeight,
      percentage: diversionRate * 100
    };
  }

  static calculateDataCompleteness(collection) {
    let completeness = 0;
    const fields = [
      'wasteData.weight',
      'wasteData.volume',
      'wasteData.wasteType',
      'actualCollectionDate',
      'verification.method'
    ];
    
    fields.forEach(field => {
      const value = this.getNestedValue(collection, field);
      if (value !== undefined && value !== null && value !== '') {
        completeness += 20;
      }
    });
    
    return completeness;
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  static async generatePredictions(collection) {
    // Simple prediction based on historical patterns
    const user = collection.requester;
    const weight = collection.wasteData.weight || 0;
    
    return {
      nextPeriodProjections: {
        expectedWasteVolume: weight * 1.05, // 5% growth assumption
        projectedCarbonSavings: weight * -0.5, // Negative = savings
        estimatedCostSavings: weight * 15,
        confidence: 75
      },
      longTermTrends: {
        yearOverYearImprovement: 8, // 8% improvement
        seasonalVariations: this.getSeasonalVariations(),
        growthProjection: 5 // 5% annual growth
      }
    };
  }

  static getSeasonalVariations() {
    return [
      { month: 1, factor: 0.9 },
      { month: 2, factor: 0.85 },
      { month: 3, factor: 0.95 },
      { month: 4, factor: 1.1 },
      { month: 5, factor: 1.15 },
      { month: 6, factor: 1.2 },
      { month: 7, factor: 1.25 },
      { month: 8, factor: 1.2 },
      { month: 9, factor: 1.1 },
      { month: 10, factor: 1.0 },
      { month: 11, factor: 0.95 },
      { month: 12, factor: 1.05 }
    ];
  }

  // Aggregate environmental impact for multiple collections or periods
  static async aggregateImpacts(query, period = 'monthly') {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();
      
      const aggregationPipeline = [
        {
          $match: {
            ...query,
            'reportingPeriod.startDate': { $gte: startDate },
            'reportingPeriod.endDate': { $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalWaste: { $sum: '$wasteData.totalWeight' },
            totalCollections: { $sum: 1 },
            avgSustainabilityScore: { $avg: '$sustainabilityMetrics.circularEconomyScore' },
            totalCarbonSavings: { $sum: '$carbonFootprint.netCarbonImpact.totalSavings' },
            totalCarbonEmissions: { $sum: '$carbonFootprint.netCarbonImpact.totalEmissions' },
            totalEnergySavings: { $sum: '$energyImpact.netEnergyImpact' },
            totalWaterSavings: { $sum: '$waterImpact.netWaterImpact' },
            totalCostSavings: { $sum: '$economicImpact.costSavings.totalCostSavings' },
            totalLandfillDiversion: { $sum: '$wasteData.divertedFromLandfill.weight' },
            sustainabilityRatings: { $push: '$sustainabilityMetrics.sustainabilityRating' }
          }
        }
      ];

      const result = await EnvironmentalImpact.aggregate(aggregationPipeline);
      
      if (result.length === 0) {
        return null;
      }

      const aggregated = result[0];
      
      // Calculate additional metrics
      const netCarbonImpact = aggregated.totalCarbonEmissions - aggregated.totalCarbonSavings;
      const avgWastePerCollection = aggregated.totalWaste / aggregated.totalCollections;
      const diversionRate = (aggregated.totalLandfillDiversion / aggregated.totalWaste) * 100;
      
      // Calculate sustainability rating distribution
      const ratingDistribution = aggregated.sustainabilityRatings.reduce((acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {});

      return {
        period: { type: period, start: startDate, end: endDate },
        summary: {
          totalWaste: aggregated.totalWaste,
          totalCollections: aggregated.totalCollections,
          avgWastePerCollection,
          avgSustainabilityScore: aggregated.avgSustainabilityScore,
          diversionRate
        },
        environmental: {
          carbon: {
            totalSavings: aggregated.totalCarbonSavings,
            totalEmissions: aggregated.totalCarbonEmissions,
            netImpact: netCarbonImpact,
            isNetPositive: netCarbonImpact < 0
          },
          energy: {
            totalSavings: aggregated.totalEnergySavings,
            isNetPositive: aggregated.totalEnergySavings > 0
          },
          water: {
            totalSavings: aggregated.totalWaterSavings,
            isNetPositive: aggregated.totalWaterSavings > 0
          }
        },
        economic: {
          totalCostSavings: aggregated.totalCostSavings,
          costSavingsPerKg: aggregated.totalCostSavings / aggregated.totalWaste
        },
        sustainabilityRatings: ratingDistribution,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error aggregating environmental impacts:', error);
      throw error;
    }
  }

  // Generate environmental report for a user, district, or system-wide
  static async generateEnvironmentalReport(scope, scopeId, period = 'monthly') {
    try {
      let query = {};
      
      // Build query based on scope
      switch (scope) {
        case 'user':
          query.user = scopeId;
          break;
        case 'district':
          query.district = scopeId;
          break;
        case 'system':
          // No additional filter - system-wide
          break;
        default:
          throw new Error('Invalid scope. Must be user, district, or system');
      }

      const aggregatedData = await this.aggregateImpacts(query, period);
      
      if (!aggregatedData) {
        return {
          scope,
          scopeId,
          period,
          message: 'No data available for the specified scope and period',
          generatedAt: new Date()
        };
      }

      // Generate insights and recommendations
      const insights = this.generateInsights(aggregatedData);
      const recommendations = this.generateRecommendations(aggregatedData);
      const achievements = this.identifyAchievements(aggregatedData);
      
      return {
        scope,
        scopeId,
        ...aggregatedData,
        insights,
        recommendations,
        achievements,
        reportId: `ENV-RPT-${Date.now()}`,
        exportFormats: ['PDF', 'Excel', 'JSON'],
        shareableLink: this.generateShareableLink(scope, scopeId, period)
      };

    } catch (error) {
      console.error('Error generating environmental report:', error);
      throw error;
    }
  }

  // Helper methods for report generation

  static generateInsights(data) {
    const insights = [];
    
    if (data.environmental.carbon.isNetPositive) {
      insights.push({
        type: 'positive',
        category: 'Carbon Impact',
        message: `Operations are carbon negative, saving ${Math.abs(data.environmental.carbon.netImpact).toFixed(1)} kg CO2`,
        impact: 'High'
      });
    }
    
    if (data.summary.diversionRate > 75) {
      insights.push({
        type: 'positive',
        category: 'Waste Diversion',
        message: `High diversion rate of ${data.summary.diversionRate.toFixed(1)}% from landfills`,
        impact: 'High'
      });
    }
    
    if (data.summary.avgSustainabilityScore > 80) {
      insights.push({
        type: 'positive',
        category: 'Sustainability',
        message: `Excellent sustainability performance with average score of ${data.summary.avgSustainabilityScore.toFixed(1)}`,
        impact: 'High'
      });
    }
    
    return insights;
  }

  static generateRecommendations(data) {
    const recommendations = [];
    
    if (!data.environmental.carbon.isNetPositive) {
      recommendations.push({
        category: 'Carbon Reduction',
        priority: 'High',
        suggestion: 'Increase recycling and composting rates to achieve carbon neutrality',
        expectedImpact: '20-30% carbon reduction',
        timeframe: '3-6 months'
      });
    }
    
    if (data.summary.diversionRate < 50) {
      recommendations.push({
        category: 'Waste Diversion',
        priority: 'High',
        suggestion: 'Improve waste sorting and recycling programs',
        expectedImpact: '15-25% increase in diversion rate',
        timeframe: '2-4 months'
      });
    }
    
    if (data.summary.avgSustainabilityScore < 60) {
      recommendations.push({
        category: 'Overall Sustainability',
        priority: 'Medium',
        suggestion: 'Implement comprehensive sustainability training and incentives',
        expectedImpact: '10-20 point score improvement',
        timeframe: '6-12 months'
      });
    }
    
    return recommendations;
  }

  static identifyAchievements(data) {
    const achievements = [];
    
    if (data.environmental.carbon.isNetPositive) {
      achievements.push('Carbon Negative Operations');
    }
    
    if (data.summary.diversionRate > 80) {
      achievements.push('Waste Diversion Champion');
    }
    
    if (data.environmental.energy.isNetPositive) {
      achievements.push('Net Energy Producer');
    }
    
    if (data.summary.avgSustainabilityScore > 90) {
      achievements.push('Sustainability Excellence');
    }
    
    if (data.economic.costSavingsPerKg > 50) {
      achievements.push('Economic Efficiency Leader');
    }
    
    return achievements;
  }

  static generateShareableLink(scope, scopeId, period) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/environmental-report?scope=${scope}&id=${scopeId}&period=${period}`;
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

  // Carbon credits management
  static async calculateCarbonCredits(impactIds) {
    try {
      const impacts = await EnvironmentalImpact.find({ _id: { $in: impactIds } });
      
      let totalCredits = 0;
      let totalValue = 0;
      const eligibleImpacts = [];

      impacts.forEach(impact => {
        if (impact.carbonCreditsEligible) {
          const credits = impact.carbonFootprint.carbonCredits.credits;
          const value = impact.carbonFootprint.carbonCredits.value;
          
          totalCredits += credits;
          totalValue += value;
          eligibleImpacts.push({
            impactId: impact.impactId,
            credits,
            value
          });
        }
      });

      return {
        totalCredits,
        totalValue,
        currency: 'LKR',
        eligibleImpacts,
        marketRate: 25 * 300, // 25 USD per ton * 300 LKR/USD
        certification: 'Pending', // Would integrate with carbon credit registries
        validityPeriod: '2 years',
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error calculating carbon credits:', error);
      throw error;
    }
  }
}

module.exports = EnvironmentalImpactService;