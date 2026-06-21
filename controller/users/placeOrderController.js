const OrderModel = require("../../models/OrderModel");

const placeOrderController = async (req, res) => {
  try {
    const currentUser = req.userId;

    const {
      items,
      shippingDetails,
      deliveryType,
      deliveryCharge,
      paymentMethod,
      totalAmount,
      discount,
      couponCode,
      appliedCoupon, // optional: থাকলে সেভ করব
      // Premium request from checkout
      subscriptionRequest,
    } = req.body || {};

    if (!items?.length) {
      return res.status(400).json({
        message: "No items provided in order.",
        error: true,
        success: false,
      });
    }

    const payload = {
      items,
      userId: currentUser,
      shippingDetails,
      deliveryType,
      deliveryCharge,
      paymentMethod,
      totalAmount,
      discount,
      couponCode: (couponCode || null) ? String(couponCode).toUpperCase() : null,
      subscriptionRequest:
        Boolean(currentUser) && subscriptionRequest === true,
    };

    if (appliedCoupon) {
      payload.appliedCoupon = appliedCoupon; // { code, type, discount } পাঠালে সেভ হবে
    }

    const savedOrder = await OrderModel.create(payload);

    return res.json({
      message: "Order placed successfully.",
      data: savedOrder,
      error: false,
      success: true,
    });

  } catch (err) {
    console.error("Order Error:", err?.message || err);
    return res.status(500).json({
      message: err?.message || "Server Error",
      error: true,
      success: false,
    });
  }
};

module.exports = placeOrderController;
