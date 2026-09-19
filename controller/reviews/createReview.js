// controller/reviews/createReview.js
const mongoose = require("mongoose");
const ReviewModel = require("../../models/reviewModel");
const UserModel = require("../../models/userModel");
const ProductModel = require("../../models/productModel");
const OrderModel = require("../../models/OrderModel");

// product avg rating update helper
async function recomputeProductRating(productId) {
  const productObjectId = new mongoose.Types.ObjectId(productId);

  const agg = await ReviewModel.aggregate([
    { $match: { productId: productObjectId } },
    {
      $group: {
        _id: "$productId",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingAvg = agg.length
    ? Math.round((agg[0].avg + Number.EPSILON) * 10) / 10
    : 0;

  const ratingCount = agg.length ? agg[0].count : 0;

  await ProductModel.findByIdAndUpdate(productId, {
    ratingAvg,
    ratingCount,
  });
}

function getReviewUserName(userDoc) {
  const accountName = userDoc?.name?.trim();
  const shippingName = userDoc?.shipping?.name?.trim();

  return accountName || shippingName || "Anonymous";
}


const createReview = async (req, res) => {
  try {
    const userId = req.userId;

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

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "orderId is required",
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "itemId is required",
      });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid productId",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid orderId",
      });
    }

    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid itemId",
      });
    }

    const productExists = await ProductModel.exists({ _id: productId });

    if (!productExists) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Product not found",
      });
    }

    // Check this order item actually belongs to this user and product
    const orderItemExists = await OrderModel.exists({
      _id: orderId,
      userId,
      items: {
        $elemMatch: {
          _id: itemId,
          productId,
        },
      },
    });

    if (!orderItemExists) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid order item for this product",
      });
    }

    let userName = "Anonymous";

    if (userId) {
      const userDoc = await UserModel.findById(userId)
        .select("name shipping.name")
        .lean();
      userName = getReviewUserName(userDoc);
    }

    // Same order item e only one review
    const existing = await ReviewModel.findOne({
      orderId,
      itemId,
    });

    if (existing) {
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
      userName,
      comment,
      rating,
      images,
    };

    const doc = await ReviewModel.create(payload);

    // Review success hole oi order-er oi item status Reviewed kore dao
    const orderUpdateResult = await OrderModel.updateOne(
      {
        _id: orderId,
        userId,
      },
      {
        $set: {
          "items.$[item].itemStatus": "Reviewed",
        },
      },
      {
        arrayFilters: [
          {
            "item._id": new mongoose.Types.ObjectId(itemId),
            "item.productId": new mongoose.Types.ObjectId(productId),
          },
        ],
      }
    );

    try {
      await recomputeProductRating(productId);
    } catch (ratingError) {
      console.error("recomputeProductRating error:", ratingError);
    }

    return res.json({
      success: true,
      error: false,
      message: "Review submitted",
      data: doc,
      orderItemStatusUpdated: orderUpdateResult.modifiedCount > 0,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({
        success: false,
        error: true,
        message: "You have already reviewed this product.",
      });
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Server error",
    });
  }
};

module.exports = createReview;