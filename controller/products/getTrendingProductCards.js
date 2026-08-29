const getProductCards = require("./getProductCards");
const productModel = require("../../models/productModel");

const { toProductCard } = getProductCards;

async function getTrendingProductCards(req, res) {
  try {
    const products = await productModel
      .find({ isPublished: true, trandingProduct: true })
      .select({
        productName: 1,
        selling: 1,
        trandingProduct: 1,
        trandingPriority: 1,
        salesOn: 1,
        handCraft: 1,
        isPublished: 1,
        totalStock: 1,
        subCategory: 1,
        "variants._id": 1,
        "variants.images": 1,
        "variants.sizes.stock": 1,
      })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const data = products.map(toProductCard);

    return res.json({
      message: "Trending product cards fetched successfully",
      data,
      error: false,
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Unable to fetch trending product cards",
      data: [],
      error: true,
      success: false,
    });
  }
}

module.exports = getTrendingProductCards;