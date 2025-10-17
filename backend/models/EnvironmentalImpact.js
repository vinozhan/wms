const mongoose = require('mongoose');

const environmentalImpactSchema = new mongoose.Schema({
  impactId: {
    type: String,
    required: [true, 'Impact ID is required'],
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: [true, 'Collection reference is required']
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  district: {
    type: String,
    required: [true, 'District is required']
  },
  reportingPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'daily'
    }
  },
  wasteData: {
    totalWeight: {
      type: Number,
      required: [true, 'Total weight is required'],
      min: [0, 'Weight cannot be negative']
    },
    totalVolume: {
      type: Number,
      min: [0, 'Volume cannot be negative']
    },
    wasteComposition: [{
      wasteType: {
        type: String,
        enum: ['general', 'recyclable', 'organic', 'hazardous', 'electronic'],
        required: true
      },
      weight: { type: Number, required: true },
      volume: { type: Number, required: true },
      percentage: { type: Number, min: 0, max: 100 }
    }],
    divertedFromLandfill: {
      weight: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  },
  carbonFootprint: {
    collectionTransport: {
      fuelConsumption: { type: Number, default: 0 }, // liters
      distance: { type: Number, default: 0 }, // kilometers  
      emissions: { type: Number, default: 0 } // kg CO2 equivalent
    },
    wasteProcessing: {
      recyclingEmissions: { type: Number, default: 0 }, // kg CO2 saved
      landfillEmissions: { type: Number, default: 0 }, // kg CO2 generated
      incinerationEmissions: { type: Number, default: 0 }, // kg CO2 generated
      compostingEmissions: { type: Number, default: 0 } // kg CO2 saved/generated
    },
    netCarbonImpact: {
      totalEmissions: { type: Number, default: 0 }, // kg CO2
      totalSavings: { type: Number, default: 0 }, // kg CO2 saved
      netImpact: { type: Number, default: 0 } // negative = carbon positive
    },
    carbonCredits: {
      eligible: { type: Boolean, default: false },
      credits: { type: Number, default: 0 }, // tons CO2 equivalent
      value: { type: Number, default: 0 } // monetary value
    }
  },
  energyImpact: {
    collectionEnergy: {
      fuelEnergy: { type: Number, default: 0 }, // kWh equivalent
      electricityUsed: { type: Number, default: 0 }, // kWh
      totalEnergyConsumed: { type: Number, default: 0 } // kWh
    },
    energySavings: {
      recyclingEnergySaved: { type: Number, default: 0 }, // kWh
      wasteToEnergyGenerated: { type: Number, default: 0 }, // kWh
      totalEnergySaved: { type: Number, default: 0 } // kWh
    },
    netEnergyImpact: { type: Number, default: 0 }, // kWh (negative = net savings)
    renewableEnergyUsed: { type: Number, default: 0 } // kWh from renewable sources
  },
  waterImpact: {
    collectionWaterUse: { type: Number, default: 0 }, // liters
    processingWaterUse: { type: Number, default: 0 }, // liters
    waterSavings: {
      recyclingWaterSaved: { type: Number, default: 0 }, // liters
      landfillLeachateAvoided: { type: Number, default: 0 }, // liters
      totalWaterSaved: { type: Number, default: 0 } // liters
    },
    netWaterImpact: { type: Number, default: 0 } // liters (negative = net savings)
  },
  airQuality: {
    particulateMatter: {
      pm25Reduction: { type: Number, default: 0 }, // micrograms/m³
      pm10Reduction: { type: Number, default: 0 } // micrograms/m³
    },
    gasEmissions: {
      methaneReduction: { type: Number, default: 0 }, // kg CH4
      nitrousOxideReduction: { type: Number, default: 0 }, // kg N2O
      volatileOrganicCompounds: { type: Number, default: 0 } // kg VOCs
    },
    airQualityIndex: {
      before: { type: Number },
      after: { type: Number },
      improvement: { type: Number }
    }
  },
  soilAndLand: {
    landfillDiversion: {
      totalDiverted: { type: Number, default: 0 }, // kg
      landfillSpaceSaved: { type: Number, default: 0 }, // cubic meters
      soilContaminationAvoided: { type: Number, default: 0 } // risk score
    },
    composting: {
      organicWasteComposted: { type: Number, default: 0 }, // kg
      compostProduced: { type: Number, default: 0 }, // kg
      soilHealthImprovement: { type: Number, default: 0 } // hectares benefited
    }
  },
  biodiversity: {
    habitatProtection: {
      landfillExpansionAvoided: { type: Number, default: 0 }, // hectares
      naturalResourcesSaved: { type: Number, default: 0 } // resource units
    },
    pollutionReduction: {
      toxicChemicalReduction: { type: Number, default: 0 }, // kg
      plasticWasteReduction: { type: Number, default: 0 }, // kg
      microplasticReduction: { type: Number, default: 0 } // estimated particles
    }
  },
  economicImpact: {
    costSavings: {
      landfillCostAvoided: { type: Number, default: 0 }, // LKR
      resourceRecoveryValue: { type: Number, default: 0 }, // LKR
      energySavingsValue: { type: Number, default: 0 }, // LKR
      totalCostSavings: { type: Number, default: 0 } // LKR
    },
    jobsCreated: {
      recyclingJobs: { type: Number, default: 0 },
      collectionJobs: { type: Number, default: 0 },
      processingJobs: { type: Number, default: 0 }
    },
    economicMultiplier: { type: Number, default: 1.0 } // economic impact multiplier
  },
  socialImpact: {
    publicHealth: {
      diseasePreventionScore: { type: Number, default: 0 },
      communityCleanlinessScore: { type: Number, default: 0 },
      airQualityHealthBenefit: { type: Number, default: 0 }
    },
    communityEngagement: {
      participationRate: { type: Number, default: 0 }, // percentage
      awarenessScore: { type: Number, default: 0 },
      satisfactionRating: { type: Number, default: 0 }
    },
    educationalImpact: {
      outreachPrograms: { type: Number, default: 0 },
      studentsEducated: { type: Number, default: 0 },
      behaviorChangeScore: { type: Number, default: 0 }
    }
  },
  sustainabilityMetrics: {
    circularEconomyScore: { type: Number, default: 0 }, // 0-100 scale
    wasteReductionRate: { type: Number, default: 0 }, // percentage
    recyclingEfficiency: { type: Number, default: 0 }, // percentage
    resourceRecoveryRate: { type: Number, default: 0 }, // percentage
    sustainabilityRating: {
      type: String,
      enum: ['Poor', 'Fair', 'Good', 'Excellent', 'Outstanding'],
      default: 'Fair'
    }
  },
  verification: {
    dataQuality: {
      completeness: { type: Number, default: 0 }, // percentage
      accuracy: { type: Number, default: 0 }, // percentage
      reliability: { type: Number, default: 0 } // percentage
    },
    certifications: [{
      type: {
        type: String,
        enum: ['ISO14001', 'carbon_neutral', 'green_certification', 'sustainability_award']
      },
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    auditTrail: [{
      action: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
      details: String
    }]
  },
  predictions: {
    nextPeriodProjections: {
      expectedWasteVolume: { type: Number },
      projectedCarbonSavings: { type: Number },
      estimatedCostSavings: { type: Number },
      confidence: { type: Number, min: 0, max: 100 }
    },
    longTermTrends: {
      yearOverYearImprovement: { type: Number }, // percentage
      seasonalVariations: [{ month: Number, factor: Number }],
      growthProjection: { type: Number }
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware
environmentalImpactSchema.pre('save', function(next) {
  if (!this.impactId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.impactId = `EI-${timestamp}-${random}`;
  }

  // Calculate net impacts
  this.calculateNetImpacts();
  
  // Calculate sustainability metrics
  this.calculateSustainabilityMetrics();
  
  next();
});

// Calculate net environmental impacts
environmentalImpactSchema.methods.calculateNetImpacts = function() {
  // Net carbon impact
  this.carbonFootprint.netCarbonImpact.totalEmissions = 
    this.carbonFootprint.collectionTransport.emissions +
    this.carbonFootprint.wasteProcessing.landfillEmissions +
    this.carbonFootprint.wasteProcessing.incinerationEmissions;

  this.carbonFootprint.netCarbonImpact.totalSavings = 
    this.carbonFootprint.wasteProcessing.recyclingEmissions +
    Math.abs(this.carbonFootprint.wasteProcessing.compostingEmissions);

  this.carbonFootprint.netCarbonImpact.netImpact = 
    this.carbonFootprint.netCarbonImpact.totalEmissions - 
    this.carbonFootprint.netCarbonImpact.totalSavings;

  // Net energy impact
  this.energyImpact.netEnergyImpact = 
    this.energyImpact.energySavings.totalEnergySaved - 
    this.energyImpact.collectionEnergy.totalEnergyConsumed;

  // Net water impact
  this.waterImpact.netWaterImpact = 
    this.waterImpact.waterSavings.totalWaterSaved - 
    (this.waterImpact.collectionWaterUse + this.waterImpact.processingWaterUse);
};

// Calculate sustainability metrics
environmentalImpactSchema.methods.calculateSustainabilityMetrics = function() {
  const totalWaste = this.wasteData.totalWeight;
  const divertedWeight = this.wasteData.divertedFromLandfill.weight;

  // Waste reduction rate
  this.sustainabilityMetrics.wasteReductionRate = 
    totalWaste > 0 ? (divertedWeight / totalWaste) * 100 : 0;

  // Recycling efficiency
  const recyclableWaste = this.wasteData.wasteComposition
    .filter(w => ['recyclable', 'organic', 'electronic'].includes(w.wasteType))
    .reduce((sum, w) => sum + w.weight, 0);
  
  this.sustainabilityMetrics.recyclingEfficiency = 
    totalWaste > 0 ? (recyclableWaste / totalWaste) * 100 : 0;

  // Resource recovery rate
  this.sustainabilityMetrics.resourceRecoveryRate = 
    this.sustainabilityMetrics.recyclingEfficiency;

  // Circular economy score (composite metric)
  const carbonScore = this.carbonFootprint.netCarbonImpact.netImpact < 0 ? 25 : 0;
  const energyScore = this.energyImpact.netEnergyImpact > 0 ? 25 : 0;
  const wasteScore = this.sustainabilityMetrics.wasteReductionRate * 0.3;
  const recyclingScore = this.sustainabilityMetrics.recyclingEfficiency * 0.2;

  this.sustainabilityMetrics.circularEconomyScore = 
    Math.min(100, carbonScore + energyScore + wasteScore + recyclingScore);

  // Sustainability rating
  const score = this.sustainabilityMetrics.circularEconomyScore;
  if (score >= 90) this.sustainabilityMetrics.sustainabilityRating = 'Outstanding';
  else if (score >= 75) this.sustainabilityMetrics.sustainabilityRating = 'Excellent';
  else if (score >= 60) this.sustainabilityMetrics.sustainabilityRating = 'Good';
  else if (score >= 40) this.sustainabilityMetrics.sustainabilityRating = 'Fair';
  else this.sustainabilityMetrics.sustainabilityRating = 'Poor';
};

// Method to generate environmental report
environmentalImpactSchema.methods.generateReport = function() {
  return {
    summary: {
      impactId: this.impactId,
      period: this.reportingPeriod,
      district: this.district,
      totalWaste: this.wasteData.totalWeight,
      sustainabilityRating: this.sustainabilityMetrics.sustainabilityRating
    },
    keyMetrics: {
      carbonFootprint: {
        netImpact: this.carbonFootprint.netCarbonImpact.netImpact,
        unit: 'kg CO2 equivalent'
      },
      energyImpact: {
        netSavings: this.energyImpact.netEnergyImpact,
        unit: 'kWh'
      },
      waterImpact: {
        netSavings: this.waterImpact.netWaterImpact,
        unit: 'liters'
      },
      wasteReduction: {
        diversionRate: this.sustainabilityMetrics.wasteReductionRate,
        unit: 'percentage'
      }
    },
    achievements: this.getAchievements(),
    recommendations: this.getRecommendations(),
    certifications: this.verification.certifications
  };
};

// Get environmental achievements
environmentalImpactSchema.methods.getAchievements = function() {
  const achievements = [];

  if (this.carbonFootprint.netCarbonImpact.netImpact < 0) {
    achievements.push('Carbon Negative Operation');
  }

  if (this.sustainabilityMetrics.wasteReductionRate > 80) {
    achievements.push('High Diversion Rate');
  }

  if (this.energyImpact.netEnergyImpact > 0) {
    achievements.push('Net Energy Positive');
  }

  if (this.sustainabilityMetrics.circularEconomyScore > 75) {
    achievements.push('Circular Economy Leader');
  }

  return achievements;
};

// Get environmental recommendations
environmentalImpactSchema.methods.getRecommendations = function() {
  const recommendations = [];

  if (this.carbonFootprint.netCarbonImpact.netImpact > 0) {
    recommendations.push({
      category: 'Carbon Reduction',
      suggestion: 'Increase recycling rates to reduce carbon footprint',
      impact: 'High'
    });
  }

  if (this.sustainabilityMetrics.recyclingEfficiency < 50) {
    recommendations.push({
      category: 'Recycling',
      suggestion: 'Improve waste sorting and recycling programs',
      impact: 'High'
    });
  }

  if (this.energyImpact.renewableEnergyUsed < this.energyImpact.collectionEnergy.totalEnergyConsumed * 0.3) {
    recommendations.push({
      category: 'Renewable Energy',
      suggestion: 'Increase use of renewable energy in operations',
      impact: 'Medium'
    });
  }

  return recommendations;
};

// Virtual for carbon credits eligibility
environmentalImpactSchema.virtual('carbonCreditsEligible').get(function() {
  return this.carbonFootprint.netCarbonImpact.netImpact < -100; // More than 100kg CO2 saved
});

// Virtual for sustainability grade
environmentalImpactSchema.virtual('sustainabilityGrade').get(function() {
  const score = this.sustainabilityMetrics.circularEconomyScore;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
});

// Indexes for efficient queries
environmentalImpactSchema.index({ impactId: 1 });
environmentalImpactSchema.index({ user: 1 });
environmentalImpactSchema.index({ collection: 1 });
environmentalImpactSchema.index({ district: 1 });
environmentalImpactSchema.index({ 'reportingPeriod.startDate': 1, 'reportingPeriod.endDate': 1 });
environmentalImpactSchema.index({ 'reportingPeriod.type': 1 });
environmentalImpactSchema.index({ 'sustainabilityMetrics.sustainabilityRating': 1 });
environmentalImpactSchema.index({ 'carbonFootprint.netCarbonImpact.netImpact': 1 });
environmentalImpactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EnvironmentalImpact', environmentalImpactSchema);