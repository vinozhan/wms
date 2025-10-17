const OrderService = require("../services/order.service");
const service = new OrderService();

exports.createOrder = async (req, res, next) => {
  try {
    const order = await service.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await service.getAllOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByDistributor = async (req, res, next) => {
  try {
    const { email } = req.params;
    const orders = await service.getOrdersByDistributor(email);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await service.getOrderById(orderId);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await service.updateOrderStatus(id, status);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await service.deleteOrder(id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    next(error);
  }
};
