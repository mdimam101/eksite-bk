
// controller/products/getProductDetails.js
const mongoose = require("mongoose");
const productModel = require("../../models/productModel");

/**
 * Get product details by ID
 * - Accepts productId from body, query, or params
 * - Validates ObjectId
 * - Returns 400/404/500 with clear messages
 * - Uses .lean() for faster, smaller response
 */
const getProductDetails = async (req, res) => {
  try {
    // ✅ accept id from body / query / params (Lambda/Vercel friendly)
    const productId =
      req.body?.productId ||
      req.query?.productId ||
      req.params?.productId ||
      req.body?.id ||
      req.query?.id ||
      req.params?.id;

    // ✅ required check
    if (!productId) {
      return res.status(400).json({
        message: "productId is required",
        error: true,
        success: false,
      });
    }

    // ✅ validate ObjectId early to avoid CastError
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Invalid productId",
        error: true,
        success: false,
      });
    }

    // ✅ fetch (optionally select a projection)
    const product = await productModel
      .findfindOne({ _id: productId, isPublished: true })
      // .select("-__v") // <- চাইলে __v বাদ দিতে পারো
      .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    // ✅ success
    return res.json({
      message: "Product details",
      data: product,
      error: false,
      success: true,
    });
  } catch (err) {
    console.error("getProductDetails error:", err);
    return res.status(500).json({
      message: "Server error",
      error: true,
      success: false,
    });
  }
};

module.exports = getProductDetails;
