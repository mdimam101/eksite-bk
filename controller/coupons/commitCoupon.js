const Coupon = require("../../models/Coupon");
const OrderModel = require("../../models/OrderModel");

module.exports = async function commitCoupon(req, res) {
  try {
    const userId = req.userId;
    const uc = String(req.body?.code || "").trim().toUpperCase();
    const orderId = req.body?.orderId;

    if (!uc || !orderId) {
      return res.status(400).json({ success: false, message: "code & orderId required" });
    }

    // 1) order belongs to user + same coupon + not committed yet  (idempotent)
    const order = await OrderModel.findOneAndUpdate(
      { _id: orderId, userId, couponCode: uc, couponCommitted: { $ne: true } },
      { $set: { couponCommitted: true } },
      { new: true }
    );

    if (!order) {
      // হয়ত কুপন মিলেনি / ইউজারের নয় / আগেই committed
      return res.status(409).json({ success: false, message: "Already committed or mismatch" });
    }

    // 2) শুধুই usage increment (no re-judgement)
    const result = await Coupon.updateOne(
      {
        code: uc,
        // 👉 যদি একদম re-judge না চাও, নিচের দুইটা লাইন তুলে দাও:
        isActive: true,
        deletedAt: null,

        // global cap respected (race-safe)
        $or: [{ usageLimitTotal: 0 }, { $expr: { $lt: ["$timesRedeemed", "$usageLimitTotal"] } }],
      },
      { $inc: { timesRedeemed: 1 } }
    );

    if (result.modifiedCount === 0) {
      // usage limit ফুরিয়ে গেলে / disable হলে increment হলো না (order flag ইতিমধ্যে set)
      return res.status(409).json({ success: false, message: "Commit rejected (limit reached/disabled)" });
    }

    return res.json({ success: true, message: "Coupon committed" });
  } catch (e) {
    console.error("commitCoupon error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
