const mongoose = require("mongoose");
const userModel = require("../../models/userModel");

const allowedPointTypes = ["add", "minus"];

const validatePointPayload = ({ userId, point, type }) => {
  if (!userId || point === undefined || point === null || !type) {
    return {
      isValid: false,
      statusCode: 400,
      message: "userId, point and type are required",
    };
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      isValid: false,
      statusCode: 400,
      message: "Invalid userId",
    };
  }

  if (!allowedPointTypes.includes(type)) {
    return {
      isValid: false,
      statusCode: 400,
      message: "type must be add or minus",
    };
  }

  const pointNumber = Number(point);

  if (Number.isNaN(pointNumber) || pointNumber <= 0) {
    return {
      isValid: false,
      statusCode: 400,
      message: "point must be a positive number",
    };
  }

  return {
    isValid: true,
    pointNumber,
  };
};

const updateUserPoint = async (req, res) => {
  try {
    const { userId, point, type } = req.body;
    const validation = validatePointPayload({ userId, point, type });

    if (!validation.isValid) {
      return res.status(validation.statusCode).json({
        success: false,
        message: validation.message,
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Lifetime points are only added or deducted manually; they never expire.
    if (type === "add") {
      user.point = (user.point || 0) + validation.pointNumber;
    }

    // Keep the lifetime point balance from going below zero.
    if (type === "minus") {
      user.point = Math.max((user.point || 0) - validation.pointNumber, 0);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User point updated successfully",
      point: user.point,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserPoint = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const user = await userModel.findById(userId).select("point");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      point: user.point || 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  updateUserPoint,
  getUserPoint,
};
