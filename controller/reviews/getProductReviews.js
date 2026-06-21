// controller/reviews/getProductReviews.js
const mongoose = require("mongoose");
const ReviewModel = require("../../models/reviewModel");

const getProductReviews = async (req, res) => {
  try {
    // /reviews/:productId  OR /reviews?productId=...
    const productId = req.params.productId || req.query.productId;
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "productId is required",
      });
    }

       if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid productId",
      });
    }


    const reviews = await ReviewModel
      .find({ productId })
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.json({
      success: true,
      error: false,
      message: "OK",
      data: reviews,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Server error",
    });
  }
};

module.exports = getProductReviews;
