const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['recycling', 'composting', 'hazardous_waste', 'bulk_collection', 'special'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  objectives: [String],
  targetAreas: [String],
  budget: {
    allocated: { type: Number, min: 0 },
    utilized: { type: Number, min: 0, default: 0 }
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    milestones: [{
      name: String,
      targetDate: Date,
      completed: { type: Boolean, default: false },
      completedDate: Date
    }]
  },
  performance: {
    participationRate: { type: Number, min: 0, max: 100, default: 0 },
    wasteDiverted: { type: Number, min: 0, default: 0 }, // in tons
    costEffectiveness: { type: Number, min: 0, default: 0 }
  },
  approvedBy: String,
  approvedAt: Date,
  createdBy: {
    type: String,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

programSchema.virtual('progress').get(function() {
  if (!this.timeline.milestones.length) return 0;
  const completed = this.timeline.milestones.filter(m => m.completed).length;
  return (completed / this.timeline.milestones.length) * 100;
});

programSchema.methods.addMilestone = function(milestone) {
  this.timeline.milestones.push(milestone);
  return this.save();
};

programSchema.methods.completeMilestone = function(milestoneIndex) {
  if (this.timeline.milestones[milestoneIndex]) {
    this.timeline.milestones[milestoneIndex].completed = true;
    this.timeline.milestones[milestoneIndex].completedDate = new Date();
    this.markModified('timeline.milestones');
  }
  return this.save();
};

module.exports = mongoose.model('Program', programSchema);