const userModel = require("../../models/userModel");
const { createAccount } = require("../../services/installCampaign");

async function userSignUpController(req, res) {
  try {
    const { email, password, name, deviceId, clientPlatform } = req.body;
    // Preserve existing signup fields, but never accept client point/grant/account IDs.
    const registrationData = { ...req.body };
    delete registrationData.point;
    delete registrationData.installRewardGranted;
    delete registrationData._id;
    delete registrationData.clientPlatform;
    for (const field of ['hasPlacedFirstOrder', 'firstOrderRewardGranted', 'firstOrderHistoryVerified', 'firstOrderCampaignVersion']) delete registrationData[field];

    if (!deviceId) {
      const user = await userModel.findOne({ email });
      // console.log("user", user);

      if (user) {
        throw new Error("Already user exist");
      }

      // to hash password
      const bcrypt = require("bcrypt");
      const saltRounds = 10;

      // check available email, password, name

      if (!email) {
        throw new Error("please provide email");
      }
      if (!password) {
        throw new Error("please provide password");
      }
      if (!name) {
        throw new Error("please provide name");
      }
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPassword = bcrypt.hashSync(password, salt);

      if (!hashPassword) {
        throw new Error("Something is wrong");
      }

      const payload = {
        ...registrationData,
        role: "GENERAL",
        password: hashPassword,
      };

      //every time user new register get email,name,password from body
      const { user: saveUser, installReward } = await createAccount(payload, clientPlatform);

      res.status(201).json({
        data: saveUser,
        installReward,
        success: true,
        error: false,
        message: "User created successfully",
      });
    } else if (deviceId) {
      // when login guest user
      const payload = {
        ...req.body,//...registrationData,
        role: "GENERAL",
      };

      //every time user new register get email,name,password from body
        // const { user: saveUser, installReward } = await createAccount(payload, clientPlatform);12
      const userData = new userModel(payload);//1
      const saveUser = await userData.save();//2

      res.status(201).json({
        data: saveUser,
        success: true,
        error: false,
        message: "User created successfully",
      });
    }
  } catch (err) {
    res.json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}
module.exports = userSignUpController;
