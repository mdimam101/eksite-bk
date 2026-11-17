const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  campaignId: { type: String, required: true, maxlength: 200 },
  eventId: { type: String, required: true, maxlength: 200 },
  productViews: { type: Number, default: 0, min: 0 },
  websiteVisits: { type: Number, default: 0, min: 0 },
  addToCart: { type: Number, default: 0, min: 0 },
  scrollPercent: { type: Number, min: 0, max: 100 },
}, { timestamps: true });

// Store each increment once and retain its timestamp for frontend time filters.
schema.index({ campaignId: 1, eventId: 1 }, { unique: true });
module.exports = mongoose.model('CampaignPerformanceEvent', schema);