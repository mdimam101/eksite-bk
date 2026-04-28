const userModel = require("../models/userModel")

const uploadProductPermission = async (userId) => {

    // search user id in mongooDb
    const user = await userModel.findById(userId)

    // check User Admin
    // if (user.role === 'ADMIN'){
    //     return true
    // }

    // return false

    return true
}

module.exports = uploadProductPermission