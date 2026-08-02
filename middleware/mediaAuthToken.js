const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const getToken = (req) => {
  // 1. Cookie থেকে token
  const cookieToken = req.cookies?.token;

  if (cookieToken) {
    return cookieToken;
  }

  // 2. Authorization Bearer token
  const authorization =
    req.headers.authorization || "";

  if (
    authorization.startsWith("Bearer ")
  ) {
    return authorization
      .slice(7)
      .trim();
  }

  // 3. Raw cookie header fallback
  const rawCookie =
    req.headers.cookie || "";

  const tokenCookie = rawCookie
    .split(";")
    .map((value) => value.trim())
    .find((value) =>
      value.startsWith("token=")
    );

  if (tokenCookie) {
    return tokenCookie.slice(
      "token=".length
    );
  }

  return null;
};

async function mediaAuthToken(
  req,
  res,
  next
) {
  try {
    const token = getToken(req);

    if (!token) {
      logger.warn(
        "media_authentication_failed",
        {
          requestId: req.requestId,
          method: req.method,
          path:
            req.originalUrl ||
            req.url,
          reason: "missing_token",
        }
      );

      return res.status(401).json({
        message: "User not logged in",
        error: true,
        success: false,
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.TOKEN_SECRET_KEY
    );

    if (!decoded?._id) {
      logger.warn(
        "media_authentication_failed",
        {
          requestId: req.requestId,
          method: req.method,
          path:
            req.originalUrl ||
            req.url,
          reason:
            "user_id_missing_from_token",
        }
      );

      return res.status(401).json({
        message:
          "Invalid or expired token",
        error: true,
        success: false,
      });
    }

    req.userId = decoded._id;

    return next();
  } catch (error) {
    logger.warn(
      "media_authentication_failed",
      {
        requestId: req.requestId,
        method: req.method,
        path:
          req.originalUrl ||
          req.url,
        errorName: error?.name,
        errorMessage: error?.message,
      }
    );

    return res.status(401).json({
      message:
        "Invalid or expired token",
      error: true,
      success: false,
    });
  }
}

module.exports = mediaAuthToken;