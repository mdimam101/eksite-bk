const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    productName: String,
    brandName: String,
    category: { type: String, trim: true },
    subCategory: String,
    description: String,
    price: Number,
    selling: Number,
    buyingPrice: Number,
    trandingProduct: {
      type: Boolean,
      default: false,
    },
    // Lower numbers are shown first in the home-page trending campaign.
    // This value is only valid (and unique) among trending products.
    trandingPriority: {
      type: Number,
      default: null,
      min: 1,
      max: 10,
      validate: {
        validator(value) {
          if (value == null) return true;
          return this.trandingProduct && Number.isInteger(value);
        },
        message(props) {
          return "trandingPriority must be an integer from 1 to 12 and can only be set for a trending product";
        },
      },
    },

    priorityProduct: {
      type: Number,
      default: 0,
      min: 0,
      max: 12,
      validate: {
        validator(value) {
          return Number.isInteger(value) && (value === 0 || Boolean(this.category?.trim()));
        },
        message: "priorityProduct must be an integer between 0 and 12 and requires a category",
      },
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

     // Main image displayed with the product description.
    describedImgUrl: {
      type: String,
      trim: true,
      default: "",
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

// The same campaign position cannot be assigned to two trending products.
// Non-trending products are excluded so they can all keep a null priority.
productSchema.index(
  { trandingPriority: 1, category: 1, priorityProduct: 1  },
  {
    unique: true,
    partialFilterExpression: {
      trandingProduct: true,
      trandingPriority: { $type: "number" },
      category: { $type: "string" },
      priorityProduct: { $gte: 1, $lte: 12 },
    },
    name: "unique_slide_priority_per_category",
  },
);

const productModel = mongoose.model("product", productSchema);
module.exports = productModel;
