const Conversation = require("../../models/conversationModel");
const Message = require("../../models/messageModel");
const { isObjectId, normalizeMessage } = require("../../utils/chat");
const { notifyCustomer } = require("../../utils/websocketSender");
const logger = require("../../utils/logger");

module.exports = async function sendAdminMessage(req, res) {
  try {
    const { conversationId } = req.body || {};
    const messageText = normalizeMessage(req.body?.message);
    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId", success: false, error: true });
    }
    if (!messageText) {
      return res.status(400).json({
        message: "Message is required and must not exceed 5000 characters",
        success: false,
        error: true,
      });
    }

    let conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found", success: false, error: true });
    }
    if (conversation.status === "CLOSED") {
      return res.status(409).json({ message: "Reopen the conversation before replying", success: false, error: true });
    }

    const savedMessage = await Message.create({
      conversationId,
      sender: "ADMIN",
      senderId: req.userId,
      message: messageText,
    });
    conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: { lastMessage: messageText, lastMessageAt: savedMessage.createdAt },
        $inc: { userUnreadCount: 1 },
      },
      { new: true }
    );

    // notifyCustomer(conversation, {
    //   type: "ADMIN_REPLY",
    //   conversationId: String(conversation._id),
    //   message: savedMessage,
    // }).catch((error) => {
    //   logger.warn("websocket_customer_notification_failed", {
    //     conversationId: conversation._id,
    //     errorName: error?.name,
    //     errorMessage: error?.message,
    //   });
    // });

    try {
  await notifyCustomer(conversation, {
    type: "ADMIN_REPLY",
    conversationId: String(
      conversation._id
    ),
    message: savedMessage,
  });
} catch (error) {
  logger.warn(
    "websocket_customer_notification_failed",
    {
      conversationId:
        conversation._id,
      errorName:
        error?.name,
      errorMessage:
        error?.message,
    }
  );
}

    return res.status(201).json({
      data: { conversation, message: savedMessage },
      message: "Reply sent",
      success: true,
      error: false,
    });
  } catch (error) {
    logger.error("admin_chat_send_failed", { errorName: error?.name, errorMessage: error?.message });
    return res.status(500).json({ message: "Unable to send reply", success: false, error: true });
  }
};
