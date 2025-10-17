const OrderRepository = require("../repositories/order.repository");

class OrderService {
  constructor() {
    this.repo = new OrderRepository();
  }

  // Create a new order
  async createOrder({ company, distributorName, distributorEmail, orderTypes, quantity, scheduledDate }) {
    // 1️⃣ Validate required fields
    if (!company || !distributorName || !distributorEmail || !orderTypes?.length || !quantity || !scheduledDate) {
      throw new Error("All required fields must be provided");
    }

    // 2️⃣ Validate scheduledDate is not in the past
    const now = new Date();
    const schedule = new Date(scheduledDate);
    if (schedule < now.setHours(0, 0, 0, 0)) {
      throw new Error("Scheduled date cannot be in the past");
    }

    // 3️⃣ Create the order
    return this.repo.create({ company, distributorName, distributorEmail, orderTypes, quantity, scheduledDate });
  }

  // Get all orders
  async getAllOrders() {
    return this.repo.findAll();
  }

  // Get orders by distributor email
  async getOrdersByDistributor(email) {
    if (!email) throw new Error("Distributor email is required");
    return this.repo.findByDistributorEmail(email);
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    const allowedStatuses = ["pending", "accepted", "completed", "not completed"];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${allowedStatuses.join(", ")}`);
    }
    return this.repo.updateStatus(orderId, status);
  }

  // Delete order
  async deleteOrder(orderId) {
    return this.repo.delete(orderId);
  }

  // Get order by ID
  async getOrderById(orderId) {
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error("Invalid order ID");
    }
    return this.repo.findById(orderId);
  }
}

module.exports = OrderService;
