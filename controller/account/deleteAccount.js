// controllers/account/deleteAccount.js
const User = require("../../models/userModel");
const Order = require("../../models/OrderModel");          // ← তোমার অর্ডার মডেলের নাম মিলাও
const Cart = require("../../models/addToCartModel");     // ← Cart মডেল না থাকলে কমেন্ট করো
const Review = require("../../models/reviewModel");        // ← Review মডেল না থাকলে কমেন্ট করো

module.exports = async function deleteAccount(req, res) {
  try {

    const userId = req.userId; // auth middleware এ set করা
    // console.log("🦌◆userId",userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1) Orders: user PII অ্যানোনিমাইজ + userId আনসেট (অ্যাকাউন্টিংয়ের জন্য অর্ডার রেখে দিচ্ছি)
    await Order.updateMany(
      { userId },
      {
        $set: {
          "shippingDetails.name": "Deleted User",
          "shippingDetails.phone": "",
          "shippingDetails.address": "",
          "shippingDetails.district": "",
          "shippingDetails.upazila": "",
          userDeletedAt: new Date(),
        },
        $unset: { userId: "" },
      }
    );

    // 2) Reviews delete (থাকলে)
    try {
      await Review.deleteMany({ userId });
    } catch (e) {
      // no-op
    }

    // 3) Cart/Wishlist ইত্যাদি delete (থাকলে)
    try {
      await Cart.deleteMany({ userId });
    } catch (e) {
      // no-op
    }

    // 4) ইউজার ডিলিট
    await User.deleteOne({ _id: userId });

    // 5) auth কুকি ক্লিয়ার (SameSite/secure তোমার সেটআপ অনুযায়ী রাখো)
    res.cookie("token", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    });

    return res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
