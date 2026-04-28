const BannerModel = require("../../models/bannerModel");

async function deleteBanner(req, res) {
  try {
    const bannerId = req.body.bannerId;

    const removed = await BannerModel.findByIdAndDelete(bannerId);

    if (!removed) {
      return res.status(404).json({
        message: "Banner not found",
        success: false,
        error: true,
      });
    }

    res.json({
      message: "Banner deleted successfully",
      success: true,
      error: false,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Server error",
      success: false,
      error: true,
    });
  }
}

module.exports = deleteBanner;
