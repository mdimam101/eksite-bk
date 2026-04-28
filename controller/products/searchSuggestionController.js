const productModel = require("../../models/productModel");

const searchSuggestionController = async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.json({ success: true, data: [] });
  }

  try {
    const suggestions = await productModel.find({
      $or: [
        { productName: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ]
    })
    .limit(5) // শুধু ৫ টা সাজেস্ট দেখানোর জন্য
    .select("productName category -_id"); // শুধু দরকারি ফিল্ড পাঠাও

    res.json({
      message: "suggestions fetched",
      data: suggestions,
      error: false,
      success: true,
    });

  } catch (err) {
    console.error("Suggestion error:", err);
    res.status(500).json({
      message: "Suggestion failed",
      data: [],
      error: true,
      success: false,
    });
  }
};

module.exports = searchSuggestionController;
