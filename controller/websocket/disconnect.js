const connectDB = require("../../config/db");
const WebsocketConnection = require("../../models/websocketConnectionModel");
const logger = require("../../utils/logger");

module.exports.handler = async (event) => {
  try {
    await connectDB();
    const connectionId = event.requestContext?.connectionId;
    if (connectionId) await WebsocketConnection.deleteOne({ connectionId });
    return { statusCode: 200, body: "Disconnected" };
  } catch (error) {
    logger.warn("websocket_disconnect_failed", {
      errorName: error?.name,
      errorMessage: error?.message,
    });
    return { statusCode: 200, body: "Disconnected" };
  }
};
