// utils/calcCouponSubtotal.js
function calculateDiscountOnSubtotal({ subtotal, coupon }) {
  const s = Math.max(Number(subtotal || 0), 0);

  // min order on subtotal
  const minOrder = Number(coupon?.minOrderAmount || 0);
  if (s < minOrder) {
    return { ok: false, reason: "Minimum order amount not met", subtotal: s, discount: 0 };
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.floor(s * ((coupon.discountPercent || 0) / 100));
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, Number(coupon.maxDiscountAmount));
    }
  } else if (coupon.type === "FLAT") {
    discount = Math.min(Number(coupon.discountAmount || 0), s);
  }

  return { ok: discount > 0, subtotal: s, discount };
}

function inWindow(now, startAt, endAt) {
  return now >= new Date(startAt) && now <= new Date(endAt);
}

module.exports = { calculateDiscountOnSubtotal, inWindow };
