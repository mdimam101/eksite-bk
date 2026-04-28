const BannerModel = require("../../models/bannerModel");

async function banarController(req, res) {
  try {
    const banners = await BannerModel.find();
    res.json({ success: true, data: banners });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch banners" });
  }
}

module.exports = banarController;
