const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const UserModel = require("../../models/userModel");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleLoginController(req, res) {
  try {
    const { credential } = req.body || {};

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

    console.log("✅ Google verified user:", {
      googleId,
      email,
      name,
      picture,
      email_verified,
    });

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Google email is not verified",
      });
    }

    let user = await UserModel.findOne({
      $or: [{ email }, { googleId }],
    });

    if (!user) {
      user = await UserModel.create({
        name: name || "Google User",
        email: email || undefined,
        googleId,
        profilePic: picture || "",
        role: "GENERAL",
      });
    } else {
      if (name) user.name = name;
      if (email) user.email = email;
      if (googleId) user.googleId = googleId;
      if (picture) user.profilePic = picture;
      if (!user.role) user.role = "GENERAL";

      await user.save();
    }

    const tokenData = {
      _id: user._id,
      email: user.email || "",
      role: user.role || "GENERAL",
    };

    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
      expiresIn: "365d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      error: false,
      message: "Google login successful",
      data: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic || "",
        phone: user.phone || "",
        shipping: user.shipping || null,
      },
    });
  } catch (error) {
    console.error("❌ Google login error:", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Google login failed",
    });
  }
}

module.exports = googleLoginController;
