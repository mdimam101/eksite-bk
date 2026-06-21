// models/OrderModel.js
const mongoose = require("mongoose");

const orderedItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  productName: String,
  color: String,
  size: String,
  quantity: Number,
  image: String,
  // NOTE: In your payload, 'price' = selling * quantity
  price: Number,
  productCodeNumber: Number,
  itemStatus: {
    type: String,
    enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Canceled", "Return"],
    default: "Pending", // Processing, Shipped, Delivered, Return
  },
});

const orderSchema = new mongoose.Schema(
  {
    items: [orderedItemSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    shippingDetails: {
      name: String,
      phone: String,
      address: String,
      district: String,
      upazila: String,
    },
    deliveryType: String,        // "Express" | "Normal"
    deliveryCharge: Number,
    paymentMethod: String,       // e.g., "COD"

     // User selected premium request during checkout
    subscriptionRequest: {
      type: Boolean,
      default: false,
    },


    // Kept for backward compatibility with your current UI payload
    totalAmount: Number,         // will mirror totals.payable
    discount: Number,            // final server-side discount
    couponCode: String,          // original code string from client

    // ✅ Server-trusted coupon snapshot (so you can audit later)
    appliedCoupon: {
      code: { type: String, default: null },
      type: { type: String, enum: ["PERCENT", "FLAT", null], default: null },
      discount: { type: Number, default: 0 },
    },

    // ✅ Canonical totals (server computed)
    totals: {
      subtotal: { type: Number, default: 0 }, // sum(selling * qty)
      delivery: { type: Number, default: 0 },
      payable:  { type: Number, default: 0 },
    },
    couponCommitted: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Canceled", "Return"],
      default: "Pending", // Processing, Shipped, Delivered, Return
    },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("order", orderSchema);
module.exports = OrderModel;
