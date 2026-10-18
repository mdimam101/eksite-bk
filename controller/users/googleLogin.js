const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const UserModel = require("../../models/userModel");
const { createAccount, rememberDevice } = require("../../services/installCampaign");
const logger = require("../../utils/logger");
const { getAuthCookieOptions } = require("../../utils/authCookie");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleLoginController(req, res) {
  try {
    const { credential, deviceId, clientPlatform } = req.body || {};

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Google credential is required",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid Google token payload",
      });
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      logger.warn("authentication_failed", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        reason: "google_email_not_verified",
      });

      return res.status(400).json({
        success: false,
        error: true,
        message: "Google email is not verified",
      });
    }

    let user = await UserModel.findOne({
      $or: [{ email }, { googleId }],
    });

    let installReward = { granted: false, points: 0 };
    if (!user) {
        try {
        // Keep campaign evidence separate from legacy deviceId-based guest login.
        const created = await createAccount({
          name: name || "Google User", email: email || undefined,
          googleId, profilePic: picture || "", role: "GENERAL",
        }, clientPlatform, deviceId);
        user = created.user;
        installReward = created.installReward;
      } catch (error) {
        // Concurrent first Google logins may race the unique email/googleId index.
        // The existing committed account can log in, but never gets a second grant.
        user = await UserModel.findOne({ $or: [{ email }, { googleId }] });
        if (!user) throw error;
        if (deviceId) await rememberDevice({ _id: user._id, deviceId, installRewardGranted: false });
      }
    } else {
      if (name) user.name = name;
      if (email) user.email = email;
      if (googleId) user.googleId = googleId;
      if (picture) user.profilePic = picture;
      if (!user.role) user.role = "GENERAL";

      await user.save();
      if (deviceId) await rememberDevice({ _id: user._id, deviceId, installRewardGranted: false });
    }

    const tokenData = {
      _id: user._id,
      email: user.email || "",
      role: user.role || "GENERAL",
    };

    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
      expiresIn: "365d",
    });

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
    //   path: "/",
    //   maxAge: 365 * 24 * 60 * 60 * 1000,
    // });
     res.cookie("token", token, getAuthCookieOptions(req));

    return res.status(200).json({
      success: true,
      error: false,
      message: "Google login successful",
      data: token,
      installReward,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic || "",
        phone: user.phone || "",
        shipping: user.shipping || null,
        point: user.point || 0,
        installRewardGranted: user.installRewardGranted === true,
        hasPlacedFirstOrder: user.hasPlacedFirstOrder === true,
        firstOrderRewardGranted: user.firstOrderRewardGranted === true,
      },
    });
  } catch (error) {
    logger.warn("authentication_failed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      errorName: error?.name,
      errorMessage: error?.message,
    });

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Google login failed",
    });
  }
}

module.exports = googleLoginController;
