const mongoose = require('mongoose');

const binRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  binType: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous', 'electronic'],
    required: [true, 'Bin type is required']
  },
  preferredLocation: {
    type: String,
    required: [true, 'Preferred location is required'],
    trim: true
  },
  justification: {
    type: String,
    required: [true, 'Justification is required'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required']
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  approvedBin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteBin'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Generate unique request ID
binRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    try {
      const count = await this.constructor.countDocuments();
      this.requestId = `REQ-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating request ID:', error);
      return next(error);
    }
  }
  next();
});

// Methods
binRequestSchema.methods.approve = function(reviewerId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewDate = new Date();
  this.reviewNotes = notes;
  return this.save();
};

binRequestSchema.methods.reject = function(reviewerId, notes = '') {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewDate = new Date();
  this.reviewNotes = notes;
  return this.save();
};

binRequestSchema.methods.complete = function(binId) {
  this.status = 'completed';
  this.approvedBin = binId;
  return this.save();
};

// Indexes
binRequestSchema.index({ requester: 1 });
binRequestSchema.index({ status: 1 });
binRequestSchema.index({ requestDate: -1 });
binRequestSchema.index({ reviewedBy: 1 });

module.exports = mongoose.model('BinRequest', binRequestSchema);