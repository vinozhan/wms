const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  paymentRates: {
    general: {
      type: Number,
      default: 30,
      min: 0
    },
    recyclable: {
      type: Number,
      default: 15,
      min: 0
    },
    organic: {
      type: Number,
      default: 25,
      min: 0
    },
    hazardous: {
      type: Number,
      default: 100,
      min: 0
    },
    contamination: {
      type: Number,
      default: 200,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 15,
      min: 0,
      max: 100
    }
  },
  idCounters: {
    binIdPrefix: {
      type: String,
      default: 'BIN'
    },
    binIdYear: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    binIdCounter: {
      type: Number,
      default: 1000
    },
    deviceIdPrefix: {
      type: String,
      default: 'DEV-SNS'
    },
    deviceIdCounter: {
      type: Number,
      default: 1
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one settings document exists
settingsSchema.index({}, { unique: true });

// Update the updatedAt field before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get or create settings
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to generate next bin ID and increment counter
settingsSchema.methods.generateNextBinId = async function() {
  const binId = `${this.idCounters.binIdPrefix}-${this.idCounters.binIdYear}-${String(this.idCounters.binIdCounter).padStart(3, '0')}`;
  this.idCounters.binIdCounter += 1;
  await this.save();
  return binId;
};

// Method to generate next device ID and increment counter
settingsSchema.methods.generateNextDeviceId = async function() {
  const deviceId = `${this.idCounters.deviceIdPrefix}-${String(this.idCounters.deviceIdCounter).padStart(3, '0')}`;
  this.idCounters.deviceIdCounter += 1;
  await this.save();
  return deviceId;
};

module.exports = mongoose.model('Settings', settingsSchema);