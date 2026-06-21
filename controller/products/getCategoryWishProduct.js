const productModel = require("../../models/productModel");

const getCategoryWishProduct = async (req, res) => {
    try {
      const { category, subCategory } = req?.body || req?.query;

      // console.log("category-----", category, "subCategory---",subCategory);
      

      let query = { isPublished: true };

      if (category) {
          query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }

      if (subCategory) {
          query.subCategory = { $regex: new RegExp(`^${subCategory}$`, 'i') };
      }

      const product = await productModel.find(query);
        res.json({
            message: 'get category wise product',
            data: product,
            success: true,
            error: false
        })

    }catch (err) {
    // send data in frontend when error
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = getCategoryWishProduct