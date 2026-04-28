const addToCartModel = require("../../models/addToCartModel");

const addToCartController = async (req, res) => {
  try {
    const currentUser = req.userId;
    console.log("■user■",currentUser);
    
    const { productId, productName, size, color, image, price, selling, productCodeNumber} = req.body;

    // Check if this product with same size/color already exists in cart
    const isProductAvailable = await addToCartModel.findOne({
      productId,
      userId: currentUser,
      productName,
      size,
      color,
      image,
      price,
      selling,
      productCodeNumber
    });

    if (isProductAvailable) {
      return res.json({
        message: "Already exists in add to cart",
        success: false,
        error: true,
      });
    }

    const payload = {
      productId,
      productName,
      quantity: 1,
      size,
      color,
      image,
      price,
      selling,
      productCodeNumber,
      userId: currentUser,
    };

    const newAddtoCart = new addToCartModel(payload);
    const savedProduct = await newAddtoCart.save();

    return res.json({
      message: 'Product added to cart',
      data: savedProduct,
      error: false,
      success: true
    });

  } catch (err) {
    res.status(400).json({
      message: err.message || "Server error",
      error: true,
      success: false,
    });
  }
};

module.exports = addToCartController;
