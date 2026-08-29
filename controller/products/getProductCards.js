const productModel = require("../../models/productModel");

const PAGE_SIZE = 15;

function parsePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function getVariantStock(variant) {
  if (!variant || !Array.isArray(variant.sizes)) return 0;

  return variant.sizes.reduce((total, size) => {
    const stock = Number(size?.stock);
    return total + (Number.isFinite(stock) && stock > 0 ? stock : 0);
  }, 0);
}

function toVariantCard(variant) {
  return {
    _id: variant._id,
    firstImage: variant.images?.[0] || null,
    stock: getVariantStock(variant),
  };
}

function toProductCard(product) {
  return {
    _id: product._id,
    productName: product.productName,
    selling: product.selling,
    trandingProduct: product.trandingProduct,
    trandingPriority: product.trandingPriority,
    salesOn: product.salesOn,
    handCraft: product.handCraft,
    isPublished: product.isPublished,
    totalStock: product.totalStock,
    subCategory: product.subCategory,
    variants: Array.isArray(product.variants)
      ? product.variants.map(toVariantCard)
      : [],
  };
}

async function getProductCards(req, res) {
  try {
    const page = parsePage(req.query.page);
    const products = await productModel
      .find({ isPublished: true })
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
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE + 1)
      .lean();

    const hasMore = products.length > PAGE_SIZE;
    const data = products.slice(0, PAGE_SIZE).map(toProductCard);

    return res.json({
      message: "Product cards fetched successfully",
      data,
      pagination: {
        page,
        limit: PAGE_SIZE,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      },
      error: false,
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Unable to fetch product cards",
      data: [],
      error: true,
      success: false,
    });
  }
}

module.exports = getProductCards;
module.exports.PAGE_SIZE = PAGE_SIZE;
module.exports.parsePage = parsePage;
module.exports.toProductCard = toProductCard;
module.exports.toVariantCard = toVariantCard;