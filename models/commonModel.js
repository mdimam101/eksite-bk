const mongoose = require('mongoose')

const commonSchema = new mongoose.Schema({

    whatsAppNumber:String,
    supportCallNumber: String,
    isDisplaySalesSlied: Boolean,
    isDisplayHandCraftSlied: Boolean,
    nrGanjMiniOrdr: String,
    DhakaMiniOrdr: String,
    OthersAreaMiniOrdr: String,
    handlingCharge: String,
    installCampaignEnabled: { type: Boolean, default: false },
    firstOrderCampaignEnabled: { type: Boolean, default: false },
    firstOrderRewardPoints: { type: Number, default: 300, min: 0, validate: Number.isSafeInteger },
    installRewardPoints: { type: Number, default: 200, min: 0, validate: Number.isSafeInteger },
    redemption: {
  firstOrderPercent: {
    type: Number,
    default: 5,
    min: 0,
    max: 100,
  },
  subsequentOrderPercent: {
    type: Number,
    default: 2,
    min: 0,
    max: 100,
  },
  maxPointsPerItem: {
    type: Number,
    default: 150,
    min: 0,
  },
  maxPointsPerOrder: {
    type: Number,
    default: 250,
    min: 0,
  },
},

}, {
  timestamps: true
})

const commonModel = mongoose.model('common', commonSchema)
module.exports = commonModel
