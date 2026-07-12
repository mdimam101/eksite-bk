const OrderModel = require("../../models/OrderModel");

const orderReturnController = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required",
      });
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or unauthorized",
      });
    }

    // শুধু Delivered order return করা যাবে
    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered items can be returned",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.itemStatus === "Return") {
      return res.status(400).json({
        success: false,
        message: "Return request already submitted",
      });
    }

    if (
      ["RConfirmed", "ReturnComplete", "Canceled"].includes(item.itemStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "This item cannot be returned",
      });
    }

    item.itemStatus = "Return";

    await order.save();

    return res.json({
      success: true,
      message: "Item return request submitted",
      data: order,
    });
  } catch (error) {
    console.error("Order return error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = orderReturnController;