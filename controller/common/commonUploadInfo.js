const commonModel = require("../../models/commonModel");

async function commonUploadInfoController(req, res) {
  try {
    // const sessionUserId = req.userId
    // if (uploadProductPermission(sessionUserId)) { throw new Error('Permission denied') }

    const commonInfo = new commonModel(req.body); // productVideo will be accepted as-is
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
