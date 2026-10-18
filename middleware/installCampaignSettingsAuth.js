const authToken = require('./authToken');
const isAdmin = require('./isAdmin');

module.exports = (req, res, next) => {
  const changesCampaign = ['installCampaignEnabled', 'installRewardPoints', 'firstOrderCampaignEnabled', 'firstOrderRewardPoints']
    .some(key => Object.hasOwn(req.body || {}, key));
  // Only campaign-setting edits add an ADMIN check; legacy callers stay compatible.
  if (changesCampaign) return authToken(req, res, () => isAdmin(req, res, next));
  next();
};