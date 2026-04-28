const OrderModel = require("../../models/OrderModel");

const getUserOrders = async (req, res) => {
    try {
      const id = req.userId;
      const allOrder = await OrderModel.find({ userId: id });
  
      res.json({
        message: 'All Orders',
        data: allOrder,
        error: false,
        success: true
      });
    } catch (err) {
      res.status(400).json({
        message: err.message || err,
        error: true,
        success: false,
      });
    }
  }; 
module.exports = getUserOrders;