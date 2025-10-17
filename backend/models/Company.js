const mongoose = require('mongoose');

const performanceMetricSchema = new mongoose.Schema({
  efficiency: { type: Number, min: 0, max: 100, default: 0 },
  compliance: { type: Number, min: 0, max: 100, default: 0 },
  collectionRate: { type: Number, min: 0, max: 100, default: 0 },
  customerSatisfaction: { type: Number, min: 0, max: 100, default: 0 },
  date: { type: Date, default: Date.now }
});

const companySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: 100
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  serviceAreas: [String],
  performanceMetrics: [performanceMetricSchema],
  complianceStatus: {
    type: String,
    enum: ['compliant', 'warning', 'non-compliant', 'suspended'],
    default: 'compliant'
  },
  rating: { type: Number, min: 1, max: 5, default: 3 },
  issuesCount: {
    missedPickups: { type: Number, default: 0 },
    damagedBins: { type: Number, default: 0 },
    complaints: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

companySchema.virtual('overallScore').get(function() {
  const latestMetrics = this.performanceMetrics[this.performanceMetrics.length - 1];
  if (!latestMetrics) return 0;
  
  return (
    latestMetrics.efficiency * 0.3 +
    latestMetrics.compliance * 0.3 +
    latestMetrics.collectionRate * 0.2 +
    latestMetrics.customerSatisfaction * 0.2
  );
});

companySchema.methods.updatePerformance = function(metrics) {
  this.performanceMetrics.push(metrics);
  return this.save();
};

companySchema.methods.addIssue = function(type) {
  if (this.issuesCount[type] !== undefined) {
    this.issuesCount[type]++;
    this.markModified('issuesCount');
  }
  return this.save();
};

module.exports = mongoose.model('Company', companySchema);