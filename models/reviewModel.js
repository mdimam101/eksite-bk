// models/reviewModel.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
      index: true,
    },

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      default: "Anonymous",
      trim: true,
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
      required: true,
    },

    images: {
      type: [String],
      default: [],
      validate: (arr) => arr.length <= 6,
    },
  },
  { timestamps: true }
);

// Same order item diye only 1 review allow
reviewSchema.index(
  { orderId: 1, itemId: 1 },
  { unique: true }
);

const ReviewModel = mongoose.model("review", reviewSchema);

module.exports = ReviewModel;