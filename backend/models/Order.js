const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    distributorName: {
      type: String,
      required: true,
      trim: true,
    },
    distributorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    orderTypes: {
      type: [String], // array of strings
      required: true,
      validate: {
        validator: function(arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "At least one order type is required",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1 kg"],
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "not completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
