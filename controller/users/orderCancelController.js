// controller/users/orderCancelController.js
const mongoose = require("mongoose");
const OrderModel = require("../../models/OrderModel");

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
      return res.json({ success: true, message: "Order cancelled successfully" });
    }
    return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = orderCancelController;
