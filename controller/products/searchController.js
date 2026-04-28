const productModel = require("../../models/productModel");

const searchProduct = async (req, res) => {
  const q = req.query.q;

  // console.log("query---------", q);
  

  try {
    const products = await productModel.find({
        $or: [
          { productName: { $regex: q, $options: "i" } }, // productName এর মধ্যে সার্চ
          { category: { $regex: q, $options: "i" } }     // category এর মধ্যে সার্চ
        ],
      });

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

module.exports = searchProduct

