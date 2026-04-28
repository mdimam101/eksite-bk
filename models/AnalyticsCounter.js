// models/AnalyticsCounter.js
const mongoose = require('mongoose');

const AnalyticsCounterSchema = new mongoose.Schema({
  key: { type: String, unique: true },  // metric|YYYY-MM-DD|sc:<name>|t:<term>
  metric: { type: String, index: true }, // visit_app, category_click, search, product_view, add_to_cart, order_confirm

  // JST-based day
  day: { type: Date, index: true },      // UTC instant for JST midnight
  date: { type: String, index: true },   // "YYYY-MM-DD" (JST)

  // Dimensions (no userId/PII)
  subCategory: { type: String, default: null }, // e.g. "men-shoes" (lowercased)
  term: { type: String, default: null },        // search term (lowercased)

  // Counter
  count: { type: Number, default: 0 }
}, { minimize: true });

AnalyticsCounterSchema.index({ metric: 1, date: 1 });
AnalyticsCounterSchema.index({ metric: 1, date: 1, subCategory: 1 });
AnalyticsCounterSchema.index({ metric: 1, date: 1, term: 1 });

module.exports = mongoose.model('AnalyticsCounter', AnalyticsCounterSchema);
