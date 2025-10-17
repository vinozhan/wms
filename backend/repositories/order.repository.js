const Order = require("../models/Order");

class OrderRepository {
  async create(orderData) {
    return Order.create(orderData);
  }

  async findAll() {
    return Order.find().sort({ scheduledDate: 1 });
  }

  async findByDistributorEmail(email) {
    return Order.find({ distributorEmail: email }).sort({ scheduledDate: 1 });
  }

  async updateStatus(orderId, status) {
    return Order.findByIdAndUpdate(orderId, { status }, { new: true });
  }

  async delete(orderId) {
    return Order.findByIdAndDelete(orderId);
  }

  async findById(orderId) {
    return Order.findById(orderId);
  }
}

module.exports = OrderRepository;
