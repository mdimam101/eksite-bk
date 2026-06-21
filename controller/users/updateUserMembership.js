const mongoose = require("mongoose");
const userModel = require("../../models/userModel");
const { addYears } = require("../../utils/subscription");

const ALLOWED_MEMBERSHIP_ROLES = ["GENERAL", "PREMIUM", "SUBPENDING"];

function toMembershipResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    subscriptionStartDate: user.subscriptionStartDate,
    subscriptionEndDate: user.subscriptionEndDate,
  };
}

async function updateUserMembership(req, res) {
  try {
    const { userId } = req.params;
    const requestedRole = String(req.body?.role || "").trim().toUpperCase();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId",
        error: true,
        success: false,
      });
    }

    if (!ALLOWED_MEMBERSHIP_ROLES.includes(requestedRole)) {
      return res.status(400).json({
        message: "Invalid membership role",
        error: true,
        success: false,
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (String(user.role).toUpperCase() === "ADMIN") {
      return res.status(400).json({
        message: "Admin membership role cannot be changed",
        error: true,
        success: false,
      });
    }

    if (
      user.role === "PREMIUM" &&
      user.subscriptionEndDate &&
      new Date(user.subscriptionEndDate).getTime() > Date.now() &&
      requestedRole === "PREMIUM"
    ) {
      return res.json({
        message: "User membership updated successfully",
        data: toMembershipResponse(user),
        error: false,
        success: true,
      });
    }

    if (requestedRole === "SUBPENDING") {
      user.role = "SUBPENDING";
      user.subscriptionStartDate = null;
      user.subscriptionEndDate = null;
    }

    if (requestedRole === "PREMIUM") {
      const now = new Date();
      user.role = "PREMIUM";
      user.subscriptionStartDate = now;
      user.subscriptionEndDate = addYears(now, 1);
    }

    if (requestedRole === "GENERAL") {
      user.role = "GENERAL";
      user.subscriptionStartDate = null;
      user.subscriptionEndDate = null;
    }

    await user.save();

    return res.json({
      message: "User membership updated successfully",
      data: toMembershipResponse(user),
      error: false,
      success: true,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = updateUserMembership;