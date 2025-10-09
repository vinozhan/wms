const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: [true, 'Payment ID is required'],
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  billingPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Billing start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Billing end date is required']
    }
  },
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  charges: {
    baseRate: { type: Number, default: 0 },
    wasteCharges: [{
      binId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WasteBin'
      },
      wasteType: String,
      weight: Number,
      volume: Number,
      rate: Number,
      amount: Number
    }],
    additionalServices: [{
      service: {
        type: String,
        enum: ['bulk_collection', 'hazardous_disposal', 'express_collection', 'bin_maintenance']
      },
      description: String,
      rate: Number,
      amount: Number
    }],
    penalties: [{
      type: {
        type: String,
        enum: ['late_payment', 'contamination', 'overweight', 'missed_collection']
      },
      description: String,
      amount: Number
    }],
    discounts: [{
      type: {
        type: String,
        enum: ['recycling_bonus', 'early_payment', 'loyalty_discount', 'volume_discount']
      },
      description: String,
      percentage: Number,
      amount: Number
    }]
  },
  totals: {
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    penaltyAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'LKR' }
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'mobile_payment', 'cash', 'check'],
      required: [true, 'Payment method is required']
    },
    provider: String,
    transactionId: String,
    reference: String,
    processingFee: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentDate: Date,
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  notes: {
    customerNotes: String,
    adminNotes: String,
    systemNotes: String
  },
  refund: {
    requested: { type: Boolean, default: false },
    requestDate: Date,
    processedDate: Date,
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['requested', 'approved', 'processed', 'rejected']
    }
  },
  recyclingCredits: {
    earnedCredits: { type: Number, default: 0 },
    usedCredits: { type: Number, default: 0 },
    creditRate: { type: Number, default: 0 },
    creditAmount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.paymentId = `PAY-${timestamp}-${random}`;
  }
  
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000);
    this.invoiceNumber = `INV-${year}${month}-${random}`;
  }
  
  this.calculateTotals();
  next();
});

paymentSchema.methods.calculateTotals = function() {
  let subtotal = this.charges.baseRate;
  
  this.charges.wasteCharges.forEach(charge => {
    subtotal += charge.amount;
  });
  
  this.charges.additionalServices.forEach(service => {
    subtotal += service.amount;
  });
  
  const penaltyAmount = this.charges.penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
  const discountAmount = this.charges.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const recyclingCreditAmount = this.recyclingCredits.usedCredits * this.recyclingCredits.creditRate;
  
  const taxRate = 0.15;
  const taxAmount = subtotal * taxRate;
  
  this.totals = {
    subtotal,
    taxAmount,
    discountAmount: discountAmount + recyclingCreditAmount,
    penaltyAmount,
    totalAmount: subtotal + taxAmount + penaltyAmount - discountAmount - recyclingCreditAmount,
    currency: this.totals.currency || 'LKR'
  };
};

paymentSchema.methods.processPayment = function(transactionData) {
  this.status = 'processing';
  this.paymentDetails = {
    ...this.paymentDetails,
    ...transactionData
  };
  this.paymentDate = new Date();
  
  return this.save();
};

paymentSchema.methods.confirmPayment = function() {
  this.status = 'completed';
  return this.save();
};

paymentSchema.methods.failPayment = function(reason) {
  this.status = 'failed';
  this.notes.systemNotes = reason;
  return this.save();
};

paymentSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && new Date() > this.dueDate;
});

paymentSchema.virtual('daysPastDue').get(function() {
  if (!this.isOverdue) return 0;
  const timeDiff = new Date() - this.dueDate;
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
});

paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Payment', paymentSchema);