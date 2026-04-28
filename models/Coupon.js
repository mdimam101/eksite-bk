// models/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },   // store UPPERCASE
  type: { type: String, enum: ["PERCENT", "FLAT"], required: true },

  // PERCENT fields
  discountPercent: { type: Number, min: 1, max: 100 },

  // FLAT fields
  discountAmount: { type: Number, min: 1 },

  // cap for percent
  maxDiscountAmount: { type: Number, default: null },

  minOrderAmount: { type: Number, default: 0 },

  // usage limits
  usageLimitTotal: { type: Number, default: 0 },     // 0 = unlimited
  usageLimitPerUser: { type: Number, default: 0 },   // 0 = unlimited

  timesRedeemed: { type: Number, default: 0 },       // increment on order success
  firstOrderOnly: { type: Boolean, default: false },

  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },

  // optional scope extension (future-ready)
  appliesTo: {
    scope: { type: String, enum: ["ORDER", "CATEGORY", "PRODUCT"], default: "ORDER" },
    categories: [{ type: String }],
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    excludeDiscountedItems: { type: Boolean, default: false }
  },

  allowStacking: { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

couponSchema.index({ code: 1 }, { unique: true });
module.exports = mongoose.model("coupon", couponSchema);
