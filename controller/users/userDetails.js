const userModel = require("../../models/userModel");
const logger = require("../../utils/logger");

async function userDetailsController (req, res) {
    try {
        const user = await userModel.findById(req.userId)
        // send data in frontend when success
        res.status(200).json({
            data: user,
            error: false,
            success: true,
            message: 'User Details'
        })
        console.log("user------", user);
        
    } catch (err) {
       logger.error("mongodb_operation_failed", {
            requestId: req.requestId,
            userId: req.userId,
            errorName: err?.name,
            errorMessage: err?.message,
            errorStack: err?.stack,
        });
        res.status(400).json({
            message: err.message || err,
            error : true,
            success: false
        })
    }
}

module.exports = userDetailsController