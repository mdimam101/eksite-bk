const commonModel = require("../../models/commonModel");

async function commonGetInfoController(req, res) {
  try {
    const getAllinfo = await commonModel.find();
    // console.log("allProduct---",allProduct);
    res.json({
      message: 'get all common info',
      data : getAllinfo,
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
