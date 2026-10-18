const commonModel = require("../../models/commonModel");

async function commonUploadInfoController(req, res) {
  try {
    // const sessionUserId = req.userId
    // if (uploadProductPermission(sessionUserId)) { throw new Error('Permission denied') }

    const active = await require('../../services/installCampaign').settings();
    const commonInfo = new commonModel({ ...req.body,
      installCampaignEnabled: req.body.installCampaignEnabled ?? active?.installCampaignEnabled ?? false,
      installRewardPoints: req.body.installRewardPoints ?? active?.installRewardPoints ?? 200,
      firstOrderCampaignEnabled: req.body.firstOrderCampaignEnabled ?? active?.firstOrderCampaignEnabled ?? false,
      firstOrderRewardPoints: req.body.firstOrderRewardPoints ?? active?.firstOrderRewardPoints ?? 300,
    }); // productVideo will be accepted as-is
    const saveCommonInfo = await commonInfo.save();

    res.status(201).json({
      message: "CommonInfo Upload successfully",
      error: false,
      success: true,
      data: saveCommonInfo,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}
module.exports = commonUploadInfoController;
