const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    productName: String,
    brandName: String,
    category: String,
    subCategory: String,
    description: String,
    price: Number,
    selling: Number,
    buyingPrice: Number,
    trandingProduct: {
      type: Boolean,
      default: false,
    },
    handCraft: {
      type: Boolean,
      default: false,
    },
    salesOn: {
      type: Boolean,
      default: false,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    // 🔽🔽 top-of-details page video support
    productVideo: {
      url: { type: String, default: "" }, // direct mp4/hls link OR YouTube/Vimeo page link OR Cloudinary url
      thumbnail: { type: String, default: "" }, // optional poster image
      autoplay: { type: Boolean, default: false },
      muted: { type: Boolean, default: true }, // best UX for autoplay on web/mobile
    },

    variants: [
      {
        SpcProductName: String,
        SpcPrice: Number,
        SpcSelling: Number,
        SpcBuyingPrice: Number,
        color: String,
        images: [String], // variant images
        sizes: [
          {
            size: String,
            stock: Number,
          },
        ],
      },
    ],
    // ✅ size guide (array of objects)
    sizeDetails: {
      type: [
        {
          size: { type: String, required: true, trim: true }, // "S","M","L"
          length: { type: Number, min: 0 },
          chest: { type: Number, min: 0 },
          unit: { type: String, enum: ["inche"], default: "inche" },
        },
      ],
      default: [],
    },
    totalStock: Number,
    productCodeNumber: { type: String, trim: true, unique: true, sparse: true },
    qualityType: String, //Normal, Good, Premium, Luxary
    productQA: {
      type: [
        {
          question: { type: String },
          answer: { type: String },
        },
      ],
      default: [],
    },
      ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // skin care info
    skinCareInfo: {
      productType: { type: String, default: "" },
      ingredients: { type: [String], default: [] },
      suitableSkinTypes: { type: [String], default: [] },
      targetConcerns: { type: [String], default: [] },
      avoidFor: { type: [String], default: [] },
      usageTime: { type: String, default: "" },
      texture: { type: String, default: "" },
      isNonComedogenic: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

const productModel = mongoose.model("product", productSchema);
module.exports = productModel;
