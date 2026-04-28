const addToCartModel = require("../../models/addToCartModel");


const getCartProductsController = async (req, res) => {
  try {
    const userId = req.userId;

    const cartItems = await addToCartModel.find({ userId }).populate("productId");

    // console.log("cartItems--------",cartItems);
    

    res.json({
      message: "Cart products fetched",
      data: cartItems,
      success: true,
      error: false,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
};

module.exports = getCartProductsController;
