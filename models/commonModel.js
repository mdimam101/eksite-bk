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

}, {
  timestamps: true
})

const commonModel = mongoose.model('common', commonSchema)
module.exports = commonModel
