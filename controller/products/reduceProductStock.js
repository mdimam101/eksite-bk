const productModel = require("../../models/productModel");

const reduceProductStock = async (req, res) => {
  try {
    const { productId, variantImage, size, quantity,  isCancelOrder} = req.body;

    if (!productId || !variantImage || typeof quantity !== 'number') {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Find variant
    const variant = product.variants.find(v =>
      v.images?.[0] === variantImage
    );

    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    // Match size (can be "")
    const sizeKey = (size || "").trim().toLowerCase();
    const sizeObj = variant.sizes.find(s =>
      (s.size || "").trim().toLowerCase() === sizeKey
    );

    if (!sizeObj) {
      return res.status(404).json({ success: false, message: "Size not found" });
    }


    // when cancel order then revised order
    if (isCancelOrder) {
      sizeObj.stock = Math.max(0, sizeObj.stock + quantity);
      product.totalStock = Math.max(0, (product.totalStock || 0) + quantity);

    } else {
      // Subtract stock
      sizeObj.stock = Math.max(0, sizeObj.stock - quantity);
      // Subtract from totalStock
      product.totalStock = Math.max(0, (product.totalStock || 0) - quantity);

    }
    
    // console.log("🦌productUpdate-----", product);
    
    // Save updated product
    await product.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: {
        productId: product._id,
        updatedSizeStock: sizeObj.stock,
        updatedTotallStock: product.totalStock
      }
    });
  } catch (err) {
    console.error("Stock update error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Something went wrong",
    });
  }
};

module.exports = reduceProductStock;
