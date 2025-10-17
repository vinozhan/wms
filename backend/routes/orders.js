const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrdersByDistributor,
  updateOrderStatus,
  deleteOrder,
  getOrderById
} = require("../controllers/order.controller");

router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/distributor/:email", getOrdersByDistributor);
router.get("/:orderId", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

module.exports = router;
