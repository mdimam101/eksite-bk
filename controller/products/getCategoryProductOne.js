const productModel = require("../../models/productModel");

const getCategoryProductOne = async (req, res) => {
  try {
    const productCategory = await productModel.distinct("category");

    // console.log("category", productCategory);

    // array to store one product from each category
    const productByCategory = []

    for(const category of productCategory) {
        const product = await productModel.findOne({category : category})
        
        if (product){
            productByCategory.push(product)
        }
    }

    res.json({
      message: "get category success",
      data: productByCategory,
      error: false,
      success: true,
    });
  } catch (err) {
    // send data in frontend when error
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
};

module.exports = getCategoryProductOne
