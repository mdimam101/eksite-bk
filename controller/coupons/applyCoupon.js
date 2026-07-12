const Coupon = require("../../models/Coupon");
const OrderModel = require("../../models/OrderModel");
const { calculateDiscountOnSubtotal, inWindow } = require("../../utils/calcCouponSubtotal");
const { NON_SUCCESS_EXCLUDE } = require("../../utils/orderStatus");
const logger = require("../../utils/logger");

module.exports = async function applyCoupon(req, res) {
  try {
    const raw = req.body?.code;
    const subtotalRaw = req.body?.subtotal;
    const userId = req.userId;

    const code = String(raw || "").trim().toUpperCase();
    const subtotal = Number(subtotalRaw ?? 0);

    if (!code || Number.isNaN(subtotal)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const coupon = await Coupon.findOne({
      code,
      isActive: true,
      deletedAt: null,
    }).lean();

    if (!coupon) {
      logger.warn("coupon_validation_failed", {
        requestId: req.requestId,
        userId,
        reason: "not_found",
      });
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (!inWindow(new Date(), coupon.startAt, coupon.endAt)) {
        logger.warn("coupon_validation_failed", {
        requestId: req.requestId,
        userId,
        reason: "inactive",
      });
      return res.status(400).json({ success: false, message: "Coupon is not active now" });
    }

    // Global cap
    if (coupon.usageLimitTotal > 0 && Number(coupon.timesRedeemed || 0) >= coupon.usageLimitTotal) {
      logger.warn("coupon_validation_failed", {
        requestId: req.requestId,
        userId,
        reason: "total_limit_reached",
      });
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }

    // ✅ firstOrderOnly IGNORE করছি — কারণ per-user limit=1 ই যথেষ্ট
    // (কনফিউশন এড়াতে কুপন ডকুমেন্টেও firstOrderOnly=false করে দাও)

    // ✅ Per-user cap (শুধু সফল/চলতি অর্ডার; NON_SUCCESS_EXCLUDE বাদ)
    if (coupon.usageLimitPerUser > 0) {
      // 👉 best: অর্ডার সেভ করার সময় couponCode UPPERCASE করে দেবে
      const usedCount = await OrderModel.countDocuments({
        userId,
        $or: [
          { "appliedCoupon.code": code },
          { couponCode: code },
        ],
        status: { $nin: NON_SUCCESS_EXCLUDE },
      });
      if (usedCount >= coupon.usageLimitPerUser) {
         logger.warn("coupon_validation_failed", {
          requestId: req.requestId,
          userId,
          reason: "per_user_limit_reached",
        });
        return res.status(400).json({ success: false, message: "You already used this coupon" });
      }
    }

    const calc = calculateDiscountOnSubtotal({ subtotal, coupon });
    if (!calc.ok) {
       logger.warn("coupon_validation_failed", {
        requestId: req.requestId,
        userId,
        reason: calc.reason || "not_eligible",
      });
      return res.status(400).json({ success: false, message: calc.reason || "Not eligible" });
    }

    return res.json({
      success: true,
      message: "Coupon applied",
      coupon: {
        code: coupon.code,
        type: coupon.type,
        discountPercent: coupon.discountPercent ?? null,
        discountAmount: coupon.discountAmount ?? null,
        maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      },
      totals: {
        subtotal: calc.subtotal,
        discount: calc.discount,
        payable: Math.max(calc.subtotal - calc.discount, 0),
      },
    });
  } catch (err) {
    logger.error("mongodb_operation_failed", {
      requestId: req.requestId,
      userId: req.userId,
      errorName: err?.name,
      errorMessage: err?.message,
      errorStack: err?.stack,
    });
    res.status(500).json({ success: false, message: "Server error" });
  }
};
