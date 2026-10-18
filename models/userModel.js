
const mongoose = require('mongoose')

const shippingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  district: String,
}, { _id: false })

const userSchema = new mongoose.Schema({
  // ✅ guest user
  deviceId: { type: String, unique: true, sparse: true, index: true },

  name: String,

  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },

  password: String,
  role: {
  type: String,
  enum: ["ADMIN", "GENERAL", "PREMIUM", "SUBPENDING"],
  default: "GENERAL",
},
  subscriptionStartDate: {
    type: Date,
    default: null,
  },

  subscriptionEndDate: {
    type: Date,
    default: null,
    index: true,
  },
  
  // ✅ phone auth
  phone: { type: String, unique: true, sparse: true, index: true },
  isPhoneVerified: { type: Boolean, default: false },

  // ✅ google auth
  googleId: { type: String, unique: true, sparse: true, index: true },
  profilePic: { type: String, default: "" },

  // ✅ shipping
  shipping: shippingSchema,
  hasPlacedFirstOrder: { type: Boolean, default: false },
  firstOrderRewardGranted: { type: Boolean, default: false },
  // New accounts have known-empty history; old unknown/deleted history is not eligibility proof.
  firstOrderHistoryVerified: { type: Boolean, default: false },
  firstOrderCampaignVersion: { type: Number, default: 0 },
  installRewardGranted: { type: Boolean, default: false },
  // Lifetime point balance. Points do not expire.
  point: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
})

const userModel = mongoose.model('user', userSchema)
module.exports = userModel