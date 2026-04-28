const Coupon = require("../../models/Coupon");
const OrderModel = require("../../models/OrderModel");
const { calculateDiscountOnSubtotal, inWindow } = require("../../utils/calcCouponSubtotal");
const { NON_SUCCESS_EXCLUDE } = require("../../utils/orderStatus");

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

    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });

    if (!inWindow(new Date(), coupon.startAt, coupon.endAt)) {
      return res.status(400).json({ success: false, message: "Coupon is not active now" });
    }

    // Global cap
    if (coupon.usageLimitTotal > 0 && Number(coupon.timesRedeemed || 0) >= coupon.usageLimitTotal) {
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
        return res.status(400).json({ success: false, message: "You already used this coupon" });
      }
    }

    const calc = calculateDiscountOnSubtotal({ subtotal, coupon });
    if (!calc.ok) {
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
    console.error("applyCoupon error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
