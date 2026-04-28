const addToCartModel = require("../../models/addToCartModel");
const productModel = require("../../models/productModel");

const increaseQuantityController = async (req, res) => {
  try {
    const userId = req.userId;
    const { cartItemId } = req.body;

    const cartItem = await addToCartModel.findOne({ _id: cartItemId, userId });
    if (!cartItem) {
      return res.status(404).json({
        message: "Product not found in cart",
        success: false,
        error: true,
      });
    }

    // ✅ Load latest product data to check stock
    const product = await productModel.findById(cartItem.productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    // ✅ Find variant by image (since color may be empty)
    const variant = product.variants.find((v) =>
      v.images?.[0] === cartItem.image
    );
    if (!variant) {
      return res.status(400).json({
        message: "Matching variant not found",
        success: false,
        error: true,
      });
    }

    // ✅ Find matching size (or "")
    const sizeKey = (cartItem.size || "").trim().toLowerCase();
    const sizeObj = variant.sizes.find(
      (s) => (s.size || "").trim().toLowerCase() === sizeKey
    );

    if (!sizeObj) {
      return res.status(400).json({
        message: "Size not found in variant",
        success: false,
        error: true,
      });
    }

    // ✅ Check stock before increment
    if (cartItem.quantity + 1 > sizeObj.stock) {
      return res.status(400).json({
        message: "Stock limit reached",
        success: false,
        error: true,
      });
    }

    cartItem.quantity += 1;
    await cartItem.save();

    res.json({
      message: "quantity increased",
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

module.exports = increaseQuantityController;