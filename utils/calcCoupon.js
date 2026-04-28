// utils/calcCoupon.js
function inWindow(now, startAt, endAt) {
  return now >= new Date(startAt) && now <= new Date(endAt);
}

// scope filter (kept simple; you can expand later)
function filterEligibleItems(items, coupon) {
  const scope = coupon?.appliesTo?.scope || "ORDER";
  if (scope === "ORDER") return items;

  if (scope === "CATEGORY") {
    const set = new Set((coupon.appliesTo.categories || []).map(c => String(c).toLowerCase()));
    return items.filter(it => set.has(String(it.category || "").toLowerCase()));
  }

  if (scope === "PRODUCT") {
    const set = new Set((coupon.appliesTo.productIds || []).map(id => String(id)));
    return items.filter(it => set.has(String(it.productId)));
  }

  return items;
}

function calculateDiscount({ items, coupon }) {
  const eligibleItems = filterEligibleItems(items, coupon);

  const eligibleSubtotal = eligibleItems.reduce(
    (sum, it) => sum + (Number(it.selling || 0) * Number(it.quantity || 1)), 0
  );
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.selling || 0) * Number(it.quantity || 1)), 0
  );

  const minOrder = coupon?.minOrderAmount || 0;
  if (eligibleSubtotal < minOrder) {
    return { ok: false, reason: "Minimum order amount not met", subtotal, eligibleSubtotal, discount: 0 };
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.floor(eligibleSubtotal * ((coupon.discountPercent || 0) / 100));
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  } else if (coupon.type === "FLAT") {
    discount = Math.min(Number(coupon.discountAmount || 0), eligibleSubtotal);
  }

  return { ok: discount > 0, subtotal, eligibleSubtotal, discount };
}

module.exports = { inWindow, calculateDiscount };
