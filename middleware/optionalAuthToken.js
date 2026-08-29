const jwt = require("jsonwebtoken");

function getRequestToken(req) {
  let token = req.cookies?.token;

  if (!token) {
    const authorization = req.headers.authorization || "";
    if (authorization.startsWith("Bearer ")) token = authorization.slice(7);
  }

  if (!token && req.headers.cookie) {
    token = req.headers.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("token="))
      ?.split("=")[1];
  }

  return token;
}

module.exports = function optionalAuthToken(req, res, next) {
  const token = getRequestToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    req.userId = decoded._id;
    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
      error: true,
      success: false,
    });
  }
};

module.exports.getRequestToken = getRequestToken;
