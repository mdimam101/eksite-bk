const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  altText: { type: String, default: "" },
});

const BannerModel = mongoose.model("Banner", bannerSchema);

module.exports = BannerModel;