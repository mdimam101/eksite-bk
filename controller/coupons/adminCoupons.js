// controller/coupons/adminCoupons.js
const Coupon = require("../../models/Coupon");

// Helper to normalize and validate fields
function normalizeCouponPayload(body) {
  const {
    code,
    type,                 // "PERCENT" | "FLAT"
    discountPercent,
    discountAmount,
    maxDiscountAmount,
    minOrderAmount,
    usageLimitTotal,
    usageLimitPerUser,
    firstOrderOnly,
    startAt,
    endAt,
    isActive,
  } = body;

  const payload = {
    code: String(code || "").trim().toUpperCase(),
    type,
    discountPercent: type === "PERCENT" ? Number(discountPercent || 0) : undefined,
    discountAmount:  type === "FLAT"    ? Number(discountAmount  || 0) : undefined,
    maxDiscountAmount: type === "PERCENT" ? (maxDiscountAmount != null ? Number(maxDiscountAmount) : null) : null,
    minOrderAmount: Number(minOrderAmount || 0),
    usageLimitTotal: Number(usageLimitTotal || 0),
    usageLimitPerUser: Number(usageLimitPerUser || 0),
    firstOrderOnly: !!firstOrderOnly,
    startAt: startAt ? new Date(startAt) : undefined,
    endAt:   endAt   ? new Date(endAt)   : undefined,
    isActive: isActive !== undefined ? !!isActive : true,
  };

  if (payload.type === "PERCENT" && (!payload.discountPercent || payload.discountPercent < 1 || payload.discountPercent > 100)) {
    throw new Error("Invalid discountPercent (1-100).");
  }
  if (payload.type === "FLAT" && (!payload.discountAmount || payload.discountAmount < 1)) {
    throw new Error("Invalid discountAmount.");
  }
  if (!payload.startAt || !payload.endAt || isNaN(payload.startAt) || isNaN(payload.endAt)) {
    throw new Error("Invalid time window (startAt/endAt).");
  }
  if (payload.startAt >= payload.endAt) {
    throw new Error("startAt must be before endAt.");
  }
  return payload;
}

// POST /api/admin/coupons
exports.createCoupon = async (req, res) => {
  try {
    const dto = normalizeCouponPayload(req.body);
    const exists = await Coupon.findOne({ code: dto.code, deletedAt: null });
    if (exists) return res.status(400).json({ success: false, message: "Coupon code already exists" });

    dto.createdBy = req.userId;
    const doc = await Coupon.create(dto);
    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Invalid payload" });
  }
};

// GET /api/admin/coupons?search=&page=&limit=
exports.listCoupons = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const q = {
      deletedAt: null,
      ...(search ? { code: { $regex: String(search).trim().toUpperCase(), $options: "i" } } : {})
    };
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Coupon.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Coupon.countDocuments(q),
    ]);
    res.json({ success: true, data: items, total });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/admin/coupons/:id
exports.updateCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const dto = normalizeCouponPayload({ ...req.body, code: (req.body.code || "").toUpperCase() });
    dto.updatedBy = req.userId;

    const updated = await Coupon.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: dto },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Invalid payload" });
  }
};

// PATCH /api/admin/coupons/:id/toggle
exports.toggleActive = async (req, res) => {
  try {
    const id = req.params.id;
    const c = await Coupon.findOne({ _id: id, deletedAt: null });
    if (!c) return res.status(404).json({ success: false, message: "Coupon not found" });
    c.isActive = !c.isActive;
    c.updatedBy = req.userId;
    await c.save();
    res.json({ success: true, data: c });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE (soft) /api/admin/coupons/:id
exports.softDeleteCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const c = await Coupon.findOne({ _id: id, deletedAt: null });
    if (!c) return res.status(404).json({ success: false, message: "Coupon not found" });
    c.deletedAt = new Date();
    c.isActive = false;
    c.updatedBy = req.userId;
    await c.save();
    res.json({ success: true, message: "Deleted" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
