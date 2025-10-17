const mongoose = require('mongoose');

const wasteBinSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: [true, 'Bin ID is required'],
    unique: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  deviceType: {
    type: String,
    enum: ['rfid_tag', 'barcode', 'smart_sensor', 'qr_code'],
    required: [true, 'Device type is required']
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true
  },
  binType: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous', 'electronic'],
    required: [true, 'Bin type is required']
  },
  capacity: {
    total: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1 liter']
    },
    current: {
      type: Number,
      default: 0,
      min: [0, 'Current capacity cannot be negative']
    },
    unit: {
      type: String,
      enum: ['liters', 'kg', 'cubic_meters'],
      default: 'liters'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      index: '2dsphere'
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  lastCollection: {
    date: { type: Date },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    weight: { type: Number },
    volume: { type: Number }
  },
  nextScheduledCollection: {
    type: Date
  },
  sensorData: {
    fillLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    temperature: { type: Number },
    humidity: { type: Number },
    lastUpdated: { type: Date, default: Date.now }
  },
  maintenanceHistory: [{
    date: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['repair', 'replacement', 'calibration', 'cleaning']
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cost: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

wasteBinSchema.virtual('fillPercentage').get(function() {
  if (this.capacity.total === 0) return 0;
  return Math.round((this.capacity.current / this.capacity.total) * 100);
});

wasteBinSchema.virtual('needsCollection').get(function() {
  return this.fillPercentage >= 80 || this.status === 'full';
});

wasteBinSchema.methods.updateSensorData = function(data) {
  this.sensorData = {
    ...this.sensorData,
    ...data,
    lastUpdated: new Date()
  };
  
  // Auto-calculate current capacity based on fill level
  if (data.fillLevel !== undefined && this.capacity.total) {
    this.capacity.current = Math.round((data.fillLevel / 100) * this.capacity.total * 10) / 10;
    // Mark capacity as modified so Mongoose saves the nested object change
    this.markModified('capacity');
  }
  
  if (data.fillLevel >= 80) {
    this.status = 'full';
  } else if (this.status === 'full' && data.fillLevel < 50) {
    this.status = 'active';
  }
  
  return this.save();
};

wasteBinSchema.methods.recordCollection = function(collectorId, weight, volume) {
  this.lastCollection = {
    date: new Date(),
    collectedBy: collectorId,
    weight: weight || 0,
    volume: volume || 0
  };
  
  this.capacity.current = 0;
  this.sensorData.fillLevel = 0;
  this.status = 'active';
  
  const now = new Date();
  this.nextScheduledCollection = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  return this.save();
};

wasteBinSchema.index({ binId: 1 });
wasteBinSchema.index({ deviceId: 1 });
wasteBinSchema.index({ owner: 1 });
wasteBinSchema.index({ location: '2dsphere' });
wasteBinSchema.index({ status: 1 });
wasteBinSchema.index({ binType: 1 });

module.exports = mongoose.model('WasteBin', wasteBinSchema);