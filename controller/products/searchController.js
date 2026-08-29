const productModel = require("../../models/productModel");
const {
  SEARCH_FIELDS,
  normalizeSearchText,
  phraseRegex,
  tokenFilter,
  rankProducts,
} = require("../../utils/productSearch");

const searchProduct = async (req, res) => {
  const q = normalizeSearchText(req.query.q);

  try {
    if (!q) {
      return res.json({
        message: "Search query is required",
        data: [],
        error: false,
        success: true,
      });
    }

    const exactPhrase = phraseRegex(q);
    const phraseMatches = await productModel.find({
      isPublished: true,
      $or: SEARCH_FIELDS.map((field) => ({ [field]: exactPhrase })),
    });

    // Only use the broader word-based fallback when the complete phrase is
    // absent. For example, "face cleanser" can still find "Facewash" through
    // the shared word "face".
    let products = phraseMatches;
    if (products.length === 0) {
      const candidates = await productModel.find({
        isPublished: true,
        ...tokenFilter(q),
      }).limit(200);
      products = rankProducts(candidates, q);
    }

    res.json({
      message: 'get product details',
      data: products,
      error: false,
      success: true
    });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({
      message: "Search failed",
      data: [],
      error: true,
      success: false
    });
  }
};

module.exports = searchProduct;
