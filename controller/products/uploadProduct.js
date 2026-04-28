const uploadProductPermission = require("../../helper/permission");
const productModel = require("../../models/productModel");

async function uploadProductController(req, res) {
  try {
    // const sessionUserId = req.userId
    // if (uploadProductPermission(sessionUserId)) { throw new Error('Permission denied') }

    const uploadProduct = new productModel(req.body); // productVideo will be accepted as-is
    const saveProduct = await uploadProduct.save();

    res.status(201).json({
      message: "Product Upload successfully",
      error: false,
      success: true,
      data: saveProduct,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}
module.exports = uploadProductController;
