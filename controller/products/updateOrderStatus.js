const mongoose = require("mongoose");
const OrderModel = require("../../models/OrderModel");
const logger = require("../../utils/logger");


const ORDER_STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Canceled"];
const ITEM_STATUSES = [
  "Normal",
  "Return",
  "RConfirmed",
  "ReturnComplete",
  "Reviewed",
  "Canceled",
];

async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status, itemId } = req.body || {};
    const isItemStatus =
      req.body?.isItemStatus === true ||
      req.body?.itemStatus === true ||
      req.body?.itemstatus === true;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, error: true, message: "Invalid orderId" });
    }

    const allowedStatuses = isItemStatus ? ITEM_STATUSES : ORDER_STATUSES;

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Invalid ${isItemStatus ? "item" : "order"} status. Allowed: ${allowedStatuses.join(", ")}`,
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
    }

    await order.save();

    return res.json({
      success: true,
      error: false,
      message: isItemStatus ? "Order item status updated" : "Order status updated",
      data: order,
    });
  } catch (err) {
    logger.error("mongodb_operation_failed", {
      requestId: req.requestId,
      userId: req.userId,
      orderId: req.params?.orderId,
      errorName: err?.name,
      errorMessage: err?.message,
      errorStack: err?.stack,
    });
    return res
      .status(500)
      .json({ success: false, error: true, message: "Server error" });
  }
}

module.exports = updateOrderStatus;