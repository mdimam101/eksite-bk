const addToCartModel = require("../../models/addToCartModel");

const removeFromCartController = async (req, res) => {
  try {
    const userId = req.userId; // Middleware থেকে আসা ইউজারের আইডি
    const { cartItemId , cartItemIds} = req.body;

    
    let removed;

    // যদি multiple id array পাঠানো হয়
    if (cartItemIds && Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      removed = await addToCartModel.deleteMany({
        _id: { $in: cartItemIds },
        userId: userId
      });
    } 
    // যদি single id পাঠানো হয়
    else if (cartItemId) {
      removed = await addToCartModel.findOneAndDelete({
        _id: cartItemId,
        userId: userId
      });
    } 
    // যদি কোনটাই না আসে
    else {
      return res.status(400).json({
        message: "Cart Item ID(s) required",
        success: false,
        error: true,
      });
    }


    res.json({
      message: "Product removed from cart",
      success: true,
      error: false,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Server error",
      success: false,
      error: true,
    });
  }
};

module.exports = removeFromCartController;