const mongoose = require("mongoose");
const OrderModel = require("../../models/OrderModel");

const ALLOWED_STATUS = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Canceled",
  "Return",
];

async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status, itemId, isItemStatus = false } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, error: true, message: "Invalid orderId" });
    }

    if (!status || !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`,
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, error: true, message: "Order not found" });
    }

    if (isItemStatus) {
      if (!itemId) {
        return res
          .status(400)
          .json({ success: false, error: true, message: "itemId is required when isItemStatus=true" });
      }

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res
          .status(400)
          .json({ success: false, error: true, message: "Invalid itemId" });
      }

      const item = order.items.id(itemId);
      if (!item) {
        return res
          .status(404)
          .json({
            success: false,
            error: true,
            message: "Order item not found",
          });
      }

      item.itemStatus = status;
    } else {
      order.status = status;
      order.items.forEach((it) => {
        it.itemStatus = status;
      });
    }

    await order.save();

    return res.json({
      success: true,
      error: false,
      message: isItemStatus ? "Order item status updated" : "Order status updated",
      data: order,
    });
  } catch (err) {
    console.error("updateOrderStatus error", err);
    return res
      .status(500)
      .json({ success: false, error: true, message: "Server error" });
  }
}

module.exports = updateOrderStatus;