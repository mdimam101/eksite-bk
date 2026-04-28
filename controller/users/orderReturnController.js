const OrderModel = require("../../models/OrderModel");

const orderReturnController = async (req, res) => {
    try {
      const { orderId, itemId} = req.params;
  
      // শুধু সেই user এর অর্ডার আপডেট করবে যিনি লগইন করেছেন
      const order = await OrderModel.findOne({ _id: orderId, userId: req.userId });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }
        // ✅ If itemId is provided → update single item's itemStatus
    if (itemId) {
      const item = order.items.id(itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }

      if (item.itemStatus === "Return") {
        return res.status(400).json({ success: false, message: "Item already returned" });
      }

      item.itemStatus = "Return";
    } else {
      // ✅ If no itemId → update full order status
      if (order.status === "Return") {
        return res.status(400).json({ success: false, message: "Order already returned" });
      }

      order.status = "Return";
    }
      // order.status = "Return";
      await order.save();
  
      res.json({ success: true, message: 'Order status updated to Return', data: order });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  module.exports = orderReturnController