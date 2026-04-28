const mongoose = require("mongoose");

const addToCartSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },
    
    quantity: {
      type: Number,
      default: 1,
    },
    productName: String,
    size: String,
    color: String,
    image: String,
    price: Number, // 🆕 save to DB
    selling: Number, // 🆕 save to DB
    productCodeNumber: Number,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const addToCartModel = mongoose.model("addToCart", addToCartSchema);

module.exports = addToCartModel;
