// controller/reviews/createReview.js
const ReviewModel = require("../../models/reviewModel");
const UserModel = require("../../models/userModel"); // আপনার ইউজার মডেল ফাইলের পথ নিশ্চিত করুন
const ProductModel = require("../../models/productModel"); // যদি avg rating আপডেট রাখতে চান

// (optional) product avg rating আপডেট হেল্পার
async function recomputeProductRating(productId) {
  try {
    const agg = await ReviewModel.aggregate([
      { $match: { productId: new require("mongoose").Types.ObjectId(productId) } },
      { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (agg?.length && ProductModel) {
      await ProductModel.findByIdAndUpdate(productId, {
        ratingAvg: Math.round((agg[0].avg + Number.EPSILON) * 10) / 10,
        ratingCount: agg[0].count,
      });
    }
  } catch (e) {
    // silently ignore rating update failure
  }
}

const createReview = async (req, res) => {
  try {
    const userId = req.userId; // 🔐 comes from authToken middleware
    const {
      productId,
      orderId,
      itemId,
      comment = "",
      rating = 5,
      images = [],
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "productId is required",
      });
    }

    // user name নেয়ার চেষ্টা
    let userName = "Anonymous";
    if (userId) {
      const userDoc = await UserModel.findById(userId).select("name");
      if (userDoc?.name) userName = userDoc.name;
    }

    // (optional) একি প্রোডাক্টে আগে রিভিউ আছে কি না (একজন ইউজার একবার)
    const existing = await ReviewModel.findOne({ productId, userId });
    if (existing) {
      // চাইলে আপডেটও করতে পারো (updateOne) — এখানে আমি ব্লক করছি
      return res.json({
        success: false,
        error: true,
        message: "You have already reviewed this product.",
      });
    }

    const payload = {
      productId,
      orderId,
      itemId,
      userId,
      userName,      // ✅ নাম সেট
      comment,
      rating,
      images,
    };

    const doc = await ReviewModel.create(payload);

    // (optional) product avg rating আপডেট
    await recomputeProductRating(productId);

    return res.json({
      success: true,
      error: false,
      message: "Review submitted",
      data: doc,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Server error",
    });
  }
};

module.exports = createReview;
