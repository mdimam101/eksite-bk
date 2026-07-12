// controller/users/orderCancelController.js
const mongoose = require("mongoose");
const OrderModel = require("../../models/OrderModel");
const logger = require("../../utils/logger");

const orderCancelController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const deleted = await OrderModel.findOneAndDelete({
      _id: orderId,
      userId: req.userId, // only owner can cancel
    });

    if (deleted) {
       logger.info("order_cancelled", {
        requestId: req.requestId,
        userId: req.userId,
        orderId,
      });
      return res.json({ success: true, message: "Order cancelled successfully" });
    }
    return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
  } catch (error) {
    logger.error("order_cancel_failed", {
      requestId: req.requestId,
      userId: req.userId,
      orderId: req.params?.orderId,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = orderCancelController;
