const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  userType: {
    type: String,
    enum: ['resident', 'business', 'collector', 'admin'],
    default: 'resident'
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending'
  },
  wasteBins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteBin'
  }],
  paymentInfo: {
    preferredMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'mobile_payment'],
      default: 'credit_card'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually'],
      default: 'monthly'
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    wasteReminders: { type: Boolean, default: true },
    collectionAlerts: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.index({ email: 1 });
userSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('User', userSchema);