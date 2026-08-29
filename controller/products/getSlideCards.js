const productModel = require("../../models/productModel");

function buildSlideCardsPipeline() {
  return [
    {
      $match: {
        isPublished: true,
        category: { $type: "string", $ne: "" },
        priorityProduct: { $gte: 1, $lte: 12 },
      },
    },
    { $sort: { category: 1, priorityProduct: 1, _id: 1 } },
    {
      $project: {
        _id: 1,
        category: 1,
        priorityProduct: 1,
        productName: 1,
        firstVariant: { $arrayElemAt: ["$variants", 0] },
        fallbackPrice: "$price",
        fallbackSellingPrice: "$selling",
      },
    },
    {
      $project: {
        _id: 1,
        category: 1,
        priorityProduct: 1,
        productName: 1,
        image: { $arrayElemAt: [{ $ifNull: ["$firstVariant.images", []] }, 0] },
        price: { $ifNull: ["$firstVariant.SpcPrice", "$fallbackPrice"] },
        sellingPrice: { $ifNull: ["$firstVariant.SpcSelling", "$fallbackSellingPrice"] },
      },
    },
    {
      $group: {
        _id: "$category",
        products: {
          $push: {
            _id: "$_id",
            productName: "$productName",
            image: "$image",
            price: "$price",
            sellingPrice: "$sellingPrice",
            priorityProduct: "$priorityProduct",
          },
        },
      },
    },
    { $project: { _id: 0, category: "$_id", products: { $slice: ["$products", 12] } } },
    { $sort: { category: 1 } },
  ];
}

async function getSlideCards(req, res) {
  try {
    const categories = await productModel.aggregate(buildSlideCardsPipeline());
    const totalProducts = categories.reduce((total, item) => total + item.products.length, 0);

    return res.json({
      message: "Slide cards fetched successfully",
      data: categories,
      totalProducts,
      error: false,
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to fetch slide cards",
      error: true,
      success: false,
    });
  }
}

module.exports = getSlideCards;
module.exports.buildSlideCardsPipeline = buildSlideCardsPipeline;
