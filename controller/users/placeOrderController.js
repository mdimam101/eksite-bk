// // controller/users/placeOrderController.js
// const OrderModel = require("../../models/OrderModel");
// const Coupon = require("../../models/Coupon");

// // --- minimal helpers (kept inline so you can copy-paste without extra files)
// function inWindow(now, startAt, endAt) {
//   return now >= new Date(startAt) && now <= new Date(endAt);
// }
// function calculateDiscount({ items, coupon }) {
//   // items: [{ price = selling*qty, quantity }]
//   const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0), 0);

//   // derive eligible subtotal from per-unit selling (price/qty)
//   // Your payload price is selling*qty. For simplest ORDER-scope:
//   const eligibleSubtotal = subtotal;

//   const minOrder = Number(coupon?.minOrderAmount || 0);
//   if (eligibleSubtotal < minOrder) {
//     return { ok: false, reason: "Minimum order amount not met", subtotal, eligibleSubtotal, discount: 0 };
//   }

//   let discount = 0;
//   if (coupon.type === "PERCENT") {
//     discount = Math.floor(eligibleSubtotal * ((coupon.discountPercent || 0) / 100));
//     if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
//   } else if (coupon.type === "FLAT") {
//     discount = Math.min(Number(coupon.discountAmount || 0), eligibleSubtotal);
//   }

//   return { ok: discount > 0, subtotal, eligibleSubtotal, discount };
// }

// const placeOrderController = async (req, res) => {
//   try {
//     const currentUser = req.userId; // from auth middleware
//     const {
//       items,              // [{ productId, productName, quantity, price, size, color, image }]
//       shippingDetails,
//       deliveryType,
//       deliveryCharge,
//       paymentMethod,
//       totalAmount,        // ignored for trust; we'll recompute payable
//       discount,           // ignored for trust; we'll recompute discount
//       couponCode,
//     } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({
//         message: "No items provided in order.",
//         error: true,
//         success: false,
//       });
//     }

//     // --- 1) Compute subtotal from payload (price already selling*qty)
//     const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0), 0);

//     // --- 2) Coupon revalidation (server is the source of truth)
//     let finalDiscount = 0;
//     let appliedCoupon = null;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({
//         code: String(couponCode).toUpperCase(),
//         isActive: true,
//         deletedAt: null,
//       });

//       if (coupon && inWindow(new Date(), coupon.startAt, coupon.endAt)) {
//         // total usage limit
//         if (coupon.usageLimitTotal > 0 && coupon.timesRedeemed >= coupon.usageLimitTotal) {
//           // limit reached → no discount
//         } else {
//           // per-user limit
//           if (coupon.usageLimitPerUser > 0) {
//             const usedByUser = await OrderModel.countDocuments({
//               userId: currentUser,
//               "appliedCoupon.code": coupon.code,
//             });
//             if (usedByUser >= coupon.usageLimitPerUser) {
//               // per-user exhausted → no discount
//             } else {
//               // first order only?
//               if (coupon.firstOrderOnly) {
//                 const hasAnyOrder = await OrderModel.exists({ userId: currentUser });
//                 if (!hasAnyOrder) {
//                   const calc = calculateDiscount({ items, coupon });
//                   if (calc.ok) {
//                     finalDiscount = calc.discount;
//                     appliedCoupon = { code: coupon.code, type: coupon.type, discount: finalDiscount };
//                   }
//                 }
//               } else {
//                 const calc = calculateDiscount({ items, coupon });
//                 if (calc.ok) {
//                   finalDiscount = calc.discount;
//                   appliedCoupon = { code: coupon.code, type: coupon.type, discount: finalDiscount };
//                 }
//               }
//             }
//           } else {
//             // no per-user limit → just validate & apply
//             const calc = calculateDiscount({ items, coupon });
//             if (calc.ok) {
//               finalDiscount = calc.discount;
//               appliedCoupon = { code: coupon.code, type: coupon.type, discount: finalDiscount };
//             }
//           }
//         }
//       }
//     }

//     // --- 3) Final totals
//     const delivery = Number(deliveryCharge || 0);
//     const payable = Math.max(subtotal - finalDiscount + delivery, 0);

//     // --- 4) Save order
//     const payload = {
//       items,
//       userId: currentUser,
//       shippingDetails,
//       deliveryType,
//       deliveryCharge: delivery,
//       paymentMethod,

//       // keep for backward compatibility with your UI:
//       totalAmount: payable,
//       discount: finalDiscount,
//       couponCode: couponCode || null,

//       appliedCoupon, // server snapshot
//       totals: { subtotal, delivery, payable },
//     };

//     const savedOrder = await OrderModel.create(payload);

//     // --- 5) Increment coupon usage if applied
//     if (appliedCoupon?.code) {
//       await Coupon.updateOne(
//         { code: appliedCoupon.code },
//         { $inc: { timesRedeemed: 1 } }
//       );
//     }

//     return res.json({
//       message: "Order placed successfully.",
//       data: savedOrder,
//       error: false,
//       success: true,
//     });
//   } catch (err) {
//     console.error("Order Error:", err);
//     return res.status(500).json({
//       message: err.message || "Server Error",
//       error: true,
//       success: false,
//     });
//   }
// };

// module.exports = placeOrderController;
// const OrderModel = require("../../models/OrderModel");


// const placeOrderController = async (req, res) => {
//   try {

    
    
//     const currentUser = req.userId;
//     console.log("placeOrderController9898", currentUser);
//     const {
//       items,
//       shippingDetails,
//       deliveryType,
//       deliveryCharge,
//     paymentMethod,
//       totalAmount,
//       discount,
//       couponCode,
//     } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({
//         message: "No items provided in order.",
//         error: true,
//         success: false,
//       });
//     }

//     const payload = {
//       items,
//       userId: currentUser,
//       shippingDetails,
//       deliveryType,
//       deliveryCharge,
//     paymentMethod,
//       totalAmount,
//       discount,
//       couponCode,
//     };

//     const newOrder = new OrderModel(payload);
//     const savedOrder = await newOrder.save();

//     return res.json({
//       message: "Order placed successfully.",
//       data: savedOrder,
//       error: false,
//       success: true,
//     });

//   } catch (err) {
//     console.error("Order Error:", err.message);
//     return res.status(500).json({
//       message: err.message || "Server Error",
//       error: true,
//       success: false,
//     });
//   }
// };

// module.exports = placeOrderController;


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
