// routes/trackBasic.js
const express = require('express');
const AnalyticsCounter = require('../models/AnalyticsCounter');
const jstDay = require('../utils/jstDay');

const router = express.Router();

const ALLOWED = new Set([
  'visit_app',
  'category_click',
  'search',
  'product_view',
  'add_to_cart',
  'order_confirm'
]);

function buildKey({ metric, date, subCategory, term }) {
  const sc = subCategory || '-';
  const t  = term || '-';
  return `${metric}|${date}|sc:${sc}|t:${t}`;
}

/**
 * POST /api/track-basic
 * Body examples:
 *  { "type":"visit_app" }
 *  { "type":"category_click", "subCategory":"men-shoes" }
 *  { "type":"search", "term":"air max" }
 *  { "type":"product_view", "subCategory":"men-shoes" }
 *  { "type":"add_to_cart", "subCategory":"men-shoes", "count":3 }
 *  { "type":"order_confirm", "subCategory":"men-shoes", "count":5 }
 */
router.post('/track-basic', async (req, res) => {
  try {
    const { type } = req.body || {};
    if (!type || !ALLOWED.has(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    // normalize subCategory if present
    let subCategory = req.body?.subCategory;
    if (subCategory) subCategory = String(subCategory).trim().toLowerCase();

    // search term only for type === 'search'
    let term = null;
    if (type === 'search') {
      term = (req.body?.term || '').toString().trim().toLowerCase();
      if (!term) {
        return res.status(400).json({ success: false, message: 'term required for search' });
      }
    }

    // count support for add_to_cart / order_confirm
    let delta = 1;
    if (type === 'add_to_cart' || type === 'order_confirm') {
      const c = Number(req.body?.count);
      delta = Number.isFinite(c) && c > 0 ? Math.floor(c) : 1;
    }

    const { dateStr, day } = jstDay(new Date());
    const metric = type;

    const doc = {
      metric,
      date: dateStr,
      day,
      subCategory: subCategory ?? null,
      term
    };

    const key = buildKey(doc);

    await AnalyticsCounter.updateOne(
      { key },
      { $setOnInsert: { ...doc, key }, $inc: { count: delta } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (e) {
    console.error('track-basic error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/** Helpers */
function parseRange(req) {
  const from = req.query.from || '1970-01-01';
  const to   = req.query.to   || '9999-12-31';
  return { from, to };
}

/** 1) Summary totals by metric in date range */
router.get('/analytics-basic/summary', async (req, res) => {
  const { from, to } = parseRange(req);
  const rows = await AnalyticsCounter.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $group: { _id: '$metric', count: { $sum: '$count' } } },
    { $sort: { count: -1 } }
  ]);
  res.json({ success: true, from, to, metrics: rows });
});

/** 2) SubCategory-wise totals (category_click, product_view, add_to_cart, order_confirm) */
router.get('/analytics-basic/subcategory', async (req, res) => {
  const { from, to } = parseRange(req);
  const metrics = ['category_click', 'product_view', 'add_to_cart', 'order_confirm', ];

  const rows = await AnalyticsCounter.aggregate([
    { $match: { date: { $gte: from, $lte: to }, metric: { $in: metrics } } },
    { $group: { _id: { metric: '$metric', subCategory: '$subCategory' }, count: { $sum: '$count' } } },
    { $sort: { count: -1 } }
  ]);

  res.json({ success: true, from, to, rows });
});

/** 3) Top search terms */
router.get('/analytics-basic/search-top', async (req, res) => {
  const { from, to } = parseRange(req);
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);

  const rows = await AnalyticsCounter.aggregate([
    { $match: { date: { $gte: from, $lte: to }, metric: 'search' } },
    { $group: { _id: '$term', count: { $sum: '$count' } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  res.json({ success: true, from, to, terms: rows });
});

/** 4) Time series by day/week/month/year (supports optional ?subCategory=) */
router.get('/analytics-basic/timeseries', async (req, res) => {
  const { from, to } = parseRange(req);
  const metrics = (req.query.metrics || 'add_to_cart,order_confirm')
    .split(',').map(s => s.trim()).filter(Boolean);

  const by = (req.query.by || 'day').toLowerCase();
  const units = new Set(['day', 'week', 'month', 'year']);
  const unit = units.has(by) ? by : 'day';

  const subCat = req.query.subCategory
    ? String(req.query.subCategory).trim().toLowerCase()
    : null;

  const match = { date: { $gte: from, $lte: to }, metric: { $in: metrics } };
  if (subCat) match.subCategory = subCat;

  const rows = await AnalyticsCounter.aggregate([
    { $match: match },
    { $addFields: {
        jsDate: { $dateFromString: { dateString: '$date', timezone: 'Asia/Tokyo' } }
      }
    },
    { $group: {
        _id: {
          bucket: { $dateTrunc: { date: '$jsDate', unit: unit, timezone: 'Asia/Tokyo' } },
          metric: '$metric'
        },
        count: { $sum: '$count' }
      }
    },
    { $sort: { '_id.bucket': 1, '_id.metric': 1 } }
  ]);

  res.json({ success: true, from, to, by: unit, subCategory: subCat, rows });
});

module.exports = router;
