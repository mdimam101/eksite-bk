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
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId, // order line item id (optional)
    },

    // 🧑‍💻 who wrote the review
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

    // ⭐ review content
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
      type: [String], // Cloudinary URLs
      default: [],
      validate: (arr) => arr.length <= 6, // keep it sane
    },
  },
  { timestamps: true }
);

const ReviewModel = mongoose.model("review", reviewSchema);
module.exports = ReviewModel;
