const userModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function userSignInController(req, res) {
  try {
    const { email, password, deviceId } = req.body || {};
    console.log("🦌◆ email, password🦌◆", req.body);

    if (!deviceId) {
      if (!email) {
        throw new Error("please Provide Email");
      }
      if (!password) {
        throw new Error("please Provide password");
      }

      // find user info from dataBase
      const user = await userModel.findOne({ email });

      if (!user) {
        throw new Error("User Not Found");
      }

      const checkPassword = await bcrypt.compare(password, user.password);

      console.log("check", checkPassword);

      if (checkPassword) {
        const tokenData = {
          _id: user._id,
          email: user.email,
        };
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
          expiresIn: "30d",
        });

        const tokenOption = {
          httpOnly: true,
          secure: false, // ✅ localhost এর জন্য false
          sameSite: "None",
        };
        // sameSite: "Lax", // ✅ Add this to allow cross-origin native er somue

        res.cookie("token", token, tokenOption).status(200).json({
          message: "Login successfully",
          data: token,
          success: true,
          error: false,
        });
      } else {
        throw new Error("Please check password");
      }
    } else if (deviceId) {
      let user = await userModel.findOne({ deviceId });
      if (!user) {
        throw new Error("User deviceId Not Found");
      }
      // if (!user) {
      //   // শুধু deviceId দিয়ে নতুন guest ইউজার
      //   user = await new userModel({ deviceId, role: "GENEREL" }).save();
      // }
      const tokenOption = {
          httpOnly: true,
          secure: false, // ✅ localhost এর জন্য false
          sameSite: "None",
        };

      const tokenData = { _id: user._id, deviceId: user.deviceId };
      console.log("◆token data", tokenData);
      const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
        expiresIn: "365d",
      });
      console.log("◆token token", token);

      return res
        .cookie("token", token, tokenOption)
        .status(200)
        .json({
          message: "Login successfully",
          data: token,
          success: true,
          error: false,
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

module.exports = userSignInController;
