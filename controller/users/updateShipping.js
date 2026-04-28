// controller/users/updateShipping.js
const userModel = require("../../models/userModel");

async function updateShipping(req, res) {
  try {
    // req.userId provided by authToken middleware
    const { name, phone, address, district, upazila } = req.body;

    // basic guard
    if (!name || !phone || !address || !district || !upazila) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "All shipping fields are required",
      });
    }

    const updated = await userModel.findByIdAndUpdate(
      req.userId,
      { $set: { shipping: { name, phone, address, district, upazila } } },
      { new: true }
    ).select("shipping");

    return res.status(200).json({
      success: true,
      error: false,
      data: updated.shipping,
      message: "Shipping updated",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to update shipping",
    });
  }
}

module.exports = updateShipping;
