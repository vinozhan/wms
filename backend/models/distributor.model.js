// models/distributor.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const distributorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"] },
    password: { type: String, required: true, minlength: 6, select: false },
    address: { type: String, required: true, trim: true, maxlength: 255 },
  },
  { timestamps: true }
);

// Hash password before saving
distributorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare passwords
distributorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Distributor = mongoose.model("Distributor", distributorSchema);

module.exports = Distributor; // ✅ Important: CommonJS export
