const OrderModel = require("../../models/OrderModel");


async function getAllOrders(req, res) {
  try {
    const allOrder = await OrderModel.find().sort({ createdAt: -1 });
    // console.log("allOrder---",allOrder);
    res.json({
      message: 'All allOrder',
      data : allOrder,
      error : false,
      success : true
  })
    
  } catch (err) {
    console.log("allOrder-err.message --",err.message );
    // send data in frontend when error
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = getAllOrders;