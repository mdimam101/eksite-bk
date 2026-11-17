const Event = require('../../models/campaignPerformanceEventModel');

function validId(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 200;
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'JSON object required';
  if (!validId(body.campaignId) || !validId(body.eventId)) return 'campaignId and eventId must be nonempty strings of at most 200 characters';
  for (const key of ['productViews', 'websiteVisits', 'addToCart']) {
    if (body[key] !== undefined && (!Number.isSafeInteger(body[key]) || body[key] < 0)) return `${key} must be a nonnegative safe integer`;
  }
  if (body.scrollPercent !== undefined && (typeof body.scrollPercent !== 'number' || !Number.isFinite(body.scrollPercent) || body.scrollPercent < 0 || body.scrollPercent > 100)) return 'scrollPercent must be a number between 0 and 100';
  if (!['productViews', 'websiteVisits', 'addToCart'].some(key => body[key] > 0) && body.scrollPercent === undefined) return 'At least one positive count or scrollPercent is required';
  return null;
}

exports.create = async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  const { campaignId, eventId, productViews, websiteVisits, addToCart, scrollPercent } = req.body;
  try {
    await Event.create({ campaignId: campaignId.trim(), eventId: eventId.trim(), productViews, websiteVisits, addToCart, scrollPercent });
    return res.status(201).json({ success: true, message: 'Campaign performance saved', duplicate: false });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, message: 'Event already saved', duplicate: true });
    return res.status(500).json({ success: false, message: 'Failed to save campaign performance' });
  }
};

exports.list = async (req, res) => {
  const { campaignId } = req.query;
  if (campaignId !== undefined && !validId(campaignId)) return res.status(400).json({ success: false, message: 'Invalid campaignId' });
  try {
    const filter = campaignId === undefined ? {} : { campaignId: campaignId.trim() };
    const data = await Event.find(filter)
      .select({ _id: 0, campaignId: 1, eventId: 1, productViews: 1, websiteVisits: 1, addToCart: 1, scrollPercent: 1, createdAt: 1 })
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch campaign performance' });
  }
};

exports.remove = async (req, res) => {
  if (!validId(req.params.campaignId)) return res.status(400).json({ success: false, message: 'Invalid campaignId' });
  const campaignId = req.params.campaignId.trim();
  try {
    const result = await Event.deleteMany({ campaignId });
    return res.json({ success: true, message: 'Campaign performance deleted', campaignId, deletedEvents: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete campaign performance' });
  }
};
