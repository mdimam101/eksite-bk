const BannerModel = require("../../models/bannerModel");

async function uploadBanner(req, res) {
  try {
    const { imageUrl, altText } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: "Image URL is required" });

    const banner = new BannerModel({ imageUrl, altText });
    await banner.save();

    res.json({ success: true, message: "Banner added successfully", banner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to upload banner" });
  }
}

module.exports = uploadBanner;