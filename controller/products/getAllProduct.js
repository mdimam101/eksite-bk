const productModel = require("../../models/productModel");

async function getAllProduct(req, res) {
  try {
    const allProduct = await productModel.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json({
      message: 'All products',
      data : allProduct,
      error : false,
      success : true
  })
    
  } catch (err) {
    // send data in frontend when error
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = getAllProduct;
