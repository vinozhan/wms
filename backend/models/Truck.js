const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  truckNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['truck', 'van', 'electric_vehicle', 'compactor'],
    default: 'truck'
  },
  capacity: {
    volume: {
      type: Number,
      required: true,
      min: 1
    },
    weight: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ['cubic_meters', 'liters'],
      default: 'cubic_meters'
    }
  },
  specifications: {
    make: String,
    model: String,
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1
    },
    engineType: {
      type: String,
      enum: ['diesel', 'petrol', 'electric', 'hybrid'],
      default: 'diesel'
    },
    fuelCapacity: Number
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'out_of_service', 'retired'],
    default: 'active'
  },
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  maintenance: {
    lastServiceDate: Date,
    nextServiceDate: Date,
    serviceInterval: {
      type: Number,
      default: 90 // days
    },
    maintenanceHistory: [{
      date: Date,
      type: {
        type: String,
        enum: ['routine', 'repair', 'inspection', 'emergency']
      },
      description: String,
      cost: Number,
      performedBy: String,
      nextServiceDue: Date
    }]
  },
  location: {
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    baseLocation: {
      address: String,
      coordinates: [Number]
    }
  },
  operationalData: {
    totalDistance: {
      type: Number,
      default: 0
    },
    totalCollections: {
      type: Number,
      default: 0
    },
    fuelConsumption: {
      type: Number,
      default: 0
    },
    averageSpeed: Number
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

// Index for geospatial queries
truckSchema.index({ 'location.currentLocation': '2dsphere' });

// Update the updatedAt field before saving
truckSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for truck display name
truckSchema.virtual('displayName').get(function() {
  return `${this.truckNumber} (${this.vehicleType})`;
});

// Method to check if maintenance is due
truckSchema.methods.isMaintenanceDue = function() {
  if (!this.maintenance.nextServiceDate) return false;
  return new Date() >= this.maintenance.nextServiceDate;
};

// Method to update operational data
truckSchema.methods.updateOperationalData = function(distance, collections, fuelUsed) {
  this.operationalData.totalDistance += distance || 0;
  this.operationalData.totalCollections += collections || 0;
  this.operationalData.fuelConsumption += fuelUsed || 0;
  return this.save();
};

// Static method to get available trucks (not assigned to any collector)
truckSchema.statics.getAvailableTrucks = function() {
  return this.find({ 
    status: 'active',
    assignedCollector: null 
  }).sort('truckNumber');
};

// Static method to get trucks by status
truckSchema.statics.getTrucksByStatus = function(status) {
  return this.find({ status }).populate('assignedCollector assignedRoute');
};

module.exports = mongoose.model('Truck', truckSchema);