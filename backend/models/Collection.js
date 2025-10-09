const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  collectionId: {
    type: String,
    required: [true, 'Collection ID is required'],
    unique: true
  },
  wasteBin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteBin',
    required: [true, 'Waste bin reference is required']
  },
  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Collector reference is required']
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  actualCollectionDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'missed', 'cancelled'],
    default: 'scheduled'
  },
  wasteData: {
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    volume: {
      type: Number,
      min: [0, 'Volume cannot be negative']
    },
    wasteType: {
      type: String,
      enum: ['general', 'recyclable', 'organic', 'hazardous', 'electronic'],
      required: [true, 'Waste type is required']
    },
    contamination: {
      detected: { type: Boolean, default: false },
      level: {
        type: String,
        enum: ['none', 'low', 'medium', 'high']
      },
      description: String
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
      required: [true, 'Collection coordinates are required']
    }
  },
  verification: {
    method: {
      type: String,
      enum: ['rfid_scan', 'barcode_scan', 'qr_scan', 'manual_entry', 'sensor_reading'],
      required: [true, 'Verification method is required']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    deviceUsed: String,
    photoEvidence: String,
    signature: String
  },
  feedback: {
    audioConfirmation: { type: Boolean, default: false },
    visualConfirmation: { type: Boolean, default: false },
    message: String
  },
  pricing: {
    baseRate: { type: Number, default: 0 },
    weightCharge: { type: Number, default: 0 },
    volumeCharge: { type: Number, default: 0 },
    totalCharge: { type: Number, default: 0 },
    currency: { type: String, default: 'LKR' }
  },
  environmental: {
    carbonFootprint: { type: Number },
    recyclingRate: { type: Number },
    wasteReduction: { type: Number }
  },
  notes: {
    collectorNotes: String,
    systemNotes: String,
    customerNotes: String
  }
}, {
  timestamps: true
});

collectionSchema.pre('save', function(next) {
  if (!this.collectionId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.collectionId = `COL-${timestamp}-${random}`;
  }
  
  if (this.wasteData.weight && this.wasteData.volume) {
    this.pricing.totalCharge = 
      this.pricing.baseRate + 
      (this.wasteData.weight * this.pricing.weightCharge) + 
      (this.wasteData.volume * this.pricing.volumeCharge);
  }
  
  next();
});

collectionSchema.methods.markCompleted = function(weight, volume, verificationData) {
  this.status = 'completed';
  this.actualCollectionDate = new Date();
  this.wasteData.weight = weight;
  this.wasteData.volume = volume;
  this.verification = {
    ...this.verification,
    ...verificationData,
    timestamp: new Date()
  };
  
  return this.save();
};

collectionSchema.methods.markMissed = function(reason) {
  this.status = 'missed';
  this.notes.systemNotes = reason;
  return this.save();
};

collectionSchema.virtual('efficiency').get(function() {
  if (!this.scheduledDate || !this.actualCollectionDate) return null;
  
  const timeDiff = Math.abs(this.actualCollectionDate - this.scheduledDate);
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff <= 2) return 'excellent';
  if (hoursDiff <= 4) return 'good';
  if (hoursDiff <= 8) return 'average';
  return 'poor';
});

collectionSchema.index({ collectionId: 1 });
collectionSchema.index({ wasteBin: 1 });
collectionSchema.index({ collector: 1 });
collectionSchema.index({ status: 1 });
collectionSchema.index({ scheduledDate: 1 });
collectionSchema.index({ actualCollectionDate: 1 });
collectionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Collection', collectionSchema);