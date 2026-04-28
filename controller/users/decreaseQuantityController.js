const addToCartModel = require("../../models/addToCartModel");


const decreaseQuantityController = async (req, res) => {
  try {
    const userId = req.userId;
    const { cartItemId } = req.body;

    // console.log("decreaseQuantity cartItemId:", cartItemId);

    const cartItem = await addToCartModel.findOne({ _id: cartItemId, userId });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found", success: false, error: true });
    }

    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      await cartItem.save();
    // } else {
    //   // quantity 1 হলে remove করে দাও
    //   await addToCartModel.deleteOne({ _id: cartItem._id });
    }

    res.json({
      message: "quantity decreased",
      data: cartItem,
      success: true,
      error: false,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message || "Internal Server Error",
      success: false,
      error: true,
    });
  }
};

module.exports = decreaseQuantityController;
