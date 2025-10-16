const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['missed_pickup', 'damaged_bin', 'complaint', 'compliance_violation', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['reported', 'in_progress', 'resolved', 'escalated', 'closed'],
    default: 'reported'
  },
  reportedBy: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  evidence: [{
    type: String, // URLs to images/documents
    description: String
  }],
  resolution: {
    actionTaken: String,
    resolvedBy: String,
    resolvedAt: Date,
    notes: String
  },
  escalation: {
    escalatedTo: String,
    reason: String,
    escalatedAt: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

issueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

issueSchema.index({ status: 1, priority: -1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);