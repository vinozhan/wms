const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: [true, 'Route ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required']
  },
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned collector is required']
  },
  backupCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicle: {
    vehicleId: { type: String, required: true },
    type: {
      type: String,
      enum: ['truck', 'van', 'electric_vehicle', 'compactor'],
      required: true
    },
    capacity: { type: Number, required: true },
    fuelType: {
      type: String,
      enum: ['diesel', 'petrol', 'electric', 'hybrid']
    }
  },
  wasteBins: [{
    bin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WasteBin',
      required: true
    },
    sequenceOrder: { type: Number, required: true },
    estimatedTime: { type: Number, default: 5 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }],
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi_weekly', 'monthly'],
      required: [true, 'Frequency is required']
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    startTime: { type: String, required: true },
    endTime: { type: String },
    estimatedDuration: { type: Number, default: 480 }
  },
  routeGeometry: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: [[Number]]
  },
  optimization: {
    isOptimized: { type: Boolean, default: false },
    optimizedAt: Date,
    algorithm: {
      type: String,
      enum: ['manual', 'dijkstra', 'genetic', 'ant_colony']
    },
    estimatedDistance: { type: Number, default: 0 },
    estimatedFuelCost: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'completed'],
    default: 'active'
  },
  performance: {
    completionRate: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    fuelEfficiency: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 },
    onTimeDelivery: { type: Number, default: 0 }
  },
  lastCompleted: {
    date: Date,
    duration: Number,
    distance: Number,
    fuelUsed: Number,
    collectionsCompleted: Number,
    issues: [String]
  }
}, {
  timestamps: true
});

routeSchema.pre('save', function(next) {
  if (!this.routeId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.routeId = `RTE-${timestamp}-${random}`;
  }
  
  this.wasteBins.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  next();
});

routeSchema.methods.optimizeRoute = function(algorithm = 'dijkstra') {
  this.optimization.algorithm = algorithm;
  this.optimization.optimizedAt = new Date();
  this.optimization.isOptimized = true;
  
  return this.save();
};

routeSchema.methods.calculateEstimates = function() {
  const baseFuelRate = 0.5;
  const baseTimePerStop = 5;
  
  this.optimization.estimatedTime = this.wasteBins.length * baseTimePerStop;
  this.optimization.estimatedDistance = this.wasteBins.length * 2;
  this.optimization.estimatedFuelCost = this.optimization.estimatedDistance * baseFuelRate;
  
  return this.save();
};

routeSchema.virtual('totalStops').get(function() {
  return this.wasteBins.length;
});

routeSchema.virtual('urgentStops').get(function() {
  return this.wasteBins.filter(bin => bin.priority === 'urgent').length;
});

routeSchema.index({ routeId: 1 });
routeSchema.index({ assignedCollector: 1 });
routeSchema.index({ district: 1 });
routeSchema.index({ status: 1 });
routeSchema.index({ 'schedule.daysOfWeek': 1 });

module.exports = mongoose.model('Route', routeSchema);