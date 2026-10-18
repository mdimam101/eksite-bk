const router = require('express').Router();
const authToken = require('../middleware/authToken');
const isAdmin = require('../middleware/isAdmin');
const Device = require('../models/InstallCampaignDevice');
const User = require('../models/userModel');
const Order = require('../models/OrderModel');
const { review } = require('../services/firstOrderCampaign');

router.use('/admin/first-order-rewards', authToken, isAdmin);
router.get('/admin/first-order-rewards', async (req, res) => {
  try {
    const page = Math.max(0, Math.min(10000, Number.parseInt(req.query.page, 10) || 0));
    const requests = await Device.find({ firstOrderRewardStatus: 'pending' }).sort({ firstOrderRequestedAt: 1, _id: 1 }).skip(page * 50).limit(50).lean();
    const data = [];
    for (const request of requests) {
      const user = await User.findById(request.firstOrderRewardUserId).select('name email point hasPlacedFirstOrder firstOrderRewardGranted').lean();
      const order = await Order.findById(request.firstOrderRewardOrderId).lean();
      data.push({ request, user, order });
    }
    res.json({ success: true, error: false, data, page });
  } catch { res.status(500).json({ success: false, error: true, message: 'Could not load first-order requests' }); }
});
router.patch('/admin/first-order-rewards/:orderId', async (req, res) => {
  try {
    const data = await review(req.params.orderId, req.body?.status, req.userId);
    res.json({ success: true, error: false, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: true, message: error.status ? error.message : 'Could not review first-order request' });
  }
});
module.exports = router;