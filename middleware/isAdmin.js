// middleware/isAdmin.js
const userModel = require("../models/userModel");

module.exports = async function isAdmin(req, res, next) {
  try {
    // needs authToken to have set req.userId
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const user = await userModel.findById(req.userId).lean();
    if (!user || String(user.role).toUpperCase() !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    next();
  } catch (e) {
    console.error("isAdmin error", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
