const userModel = require("../../models/userModel");

async function userDetailsController (req, res) {
    try {
        console.log("■🦌◆user id --", req.userId); //authToken jeta pathabe oita dorbe
        const user = await userModel.findById(req.userId)
        console.log("◆user details");
        // send data in frontend when success
        res.status(200).json({
            data: user,
            error: false,
            success: true,
            message: 'User Details'
        })
        console.log("user------", user);
        
    } catch (err) {
        // send data in frontend when error
        res.status(400).json({
            message: err.message || err,
            error : true,
            success: false
        })
    }
}

module.exports = userDetailsController