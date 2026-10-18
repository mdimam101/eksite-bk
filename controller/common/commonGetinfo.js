const commonModel = require("../../models/commonModel");

async function commonGetInfoController(req, res) {
  try {
    const getAllinfo = await commonModel.find();
    // Keep the existing array/order and other fields; expose active install settings.
    const active = await require('../../services/installCampaign').settings();
    res.json({
      message: 'get all common info',
      data : getAllinfo.map(row => ({ ...row.toObject(),
        installCampaignEnabled: active?.installCampaignEnabled ?? false,
        installRewardPoints: active?.installRewardPoints ?? 200,
        firstOrderCampaignEnabled: active?.firstOrderCampaignEnabled ?? false,
        firstOrderRewardPoints: active?.firstOrderRewardPoints ?? 300,
      })),
      error : false,
      success : true
  })
    
  } catch (err) {
    // send data in frontend when error
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = commonGetInfoController;
