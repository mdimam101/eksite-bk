const userModel = require("../../models/userModel");

async function allUsers(req, res) {

    try {

        const AllUsers = await userModel.find()
        res.json({
            message: 'User Details',
            data : AllUsers,
            error : false,
            success : true
        })
        // console.log("allUsers------", user);
    } catch (err) {
        res.status(400).json({
            message: err.message || err,
            error : true,
            success: false
        })
    }
    
}

module.exports = allUsers