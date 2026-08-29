const jwt = require("jsonwebtoken");
const connectDB = require("../../config/db");
const userModel = require("../../models/userModel");
const WebsocketConnection = require("../../models/websocketConnectionModel");
const { normalizeGuestId } = require("../../utils/chat");
const logger = require("../../utils/logger");

function getToken(event) {
  const queryToken = event.queryStringParameters?.token;
  if (queryToken) return queryToken;

  const authorization = event.headers?.Authorization || event.headers?.authorization || "";
  if (authorization.startsWith("Bearer ")) return authorization.slice(7);

  const cookie = event.headers?.Cookie || event.headers?.cookie || "";
  return cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("token="))
    ?.split("=")[1] || null;
}

module.exports.handler = async (event) => {
  try {
    await connectDB();
    const connectionId = event.requestContext?.connectionId;
    const domainName = event.requestContext?.domainName;
    const stage = event.requestContext?.stage;
    if (!connectionId || !domainName || !stage) return { statusCode: 400, body: "Invalid connection" };

    const requestedType = String(event.queryStringParameters?.type || "GUEST").toUpperCase();
    const guestId = normalizeGuestId(event.queryStringParameters?.guestId);
    const token = getToken(event);
    let connectionType;
    let userId = null;

    if (token) {
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
      const user = await userModel.findById(decoded._id).select("_id role").lean();
      if (!user) return { statusCode: 401, body: "Invalid user" };

      if (requestedType === "ADMIN") {
        if (String(user.role).toUpperCase() !== "ADMIN") {
          return { statusCode: 403, body: "Admin only" };
        }
        connectionType = "ADMIN";
      } else {
        connectionType = "USER";
      }
      userId = user._id;
    } else {
      if (requestedType !== "GUEST" || !guestId) {
        return { statusCode: 401, body: "Authentication or a valid guestId is required" };
      }
      connectionType = "GUEST";
    }

    await WebsocketConnection.findOneAndUpdate(
      { connectionId },
      {
        $set: {
          connectionType,
          userId,
          guestId,
          endpoint: `https://${domainName}/${stage}`,
          connectedAt: new Date(),
        },
      },
      { upsert: true, runValidators: true }
    );

    return { statusCode: 200, body: "Connected" };
  } catch (error) {
    logger.warn("websocket_connect_failed", {
      errorName: error?.name,
      errorMessage: error?.message,
    });
    const unauthorized = ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error?.name);
    return { statusCode: unauthorized ? 401 : 500, body: unauthorized ? "Invalid token" : "Connection failed" };
  }
};
