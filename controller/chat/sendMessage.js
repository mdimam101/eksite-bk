// const Conversation = require("../../models/conversationModel");
// const Message = require("../../models/messageModel");
// const { normalizeMessage } = require("../../utils/chat");
// const { findCustomerConversation } = require("../../utils/chatIdentity");
// const { notifyAdmins } = require("../../utils/websocketSender");
// const logger = require("../../utils/logger");

// module.exports = async function sendMessage(req, res) {
//   try {
//     const messageText = normalizeMessage(req.body?.message);
//     if (!messageText) {
//       return res.status(400).json({
//         message: "Message is required and must not exceed 5000 characters",
//         success: false,
//         error: true,
//       });
//     }

//     let { conversation, guestId } = await findCustomerConversation(req);
//     if (!req.userId && !guestId) {
//       return res.status(400).json({
//         message: "A valid guestId is required for guest chat",
//         success: false,
//         error: true,
//       });
//     }

//     if (!conversation) {
//       conversation = await Conversation.create({
//         userId: req.userId || null,
//         guestId,
//       });
//     }

//     const savedMessage = await Message.create({
//       conversationId: conversation._id,
//       sender: "USER",
//       senderId: req.userId || null,
//       message: messageText,
//     });

//     conversation = await Conversation.findByIdAndUpdate(
//       conversation._id,
//       {
//         $set: { lastMessage: messageText, lastMessageAt: savedMessage.createdAt },
//         $inc: { adminUnreadCount: 1 },
//       },
//       { new: true }
//     );

//     notifyAdmins({
//       type: "NEW_MESSAGE",
//       conversationId: String(conversation._id),
//       message: savedMessage,
//     }).catch((error) => {
//       logger.warn("websocket_admin_notification_failed", {
//         conversationId: conversation._id,
//         errorName: error?.name,
//         errorMessage: error?.message,
//       });
//     });

//     return res.status(201).json({
//       data: { conversation, message: savedMessage },
//       message: "Message sent",
//       success: true,
//       error: false,
//     });
//   } catch (error) {
//     logger.error("chat_send_failed", { errorName: error?.name, errorMessage: error?.message });
//     return res.status(500).json({ message: "Unable to send message", success: false, error: true });
//   }
// };
const Conversation = require("../../models/conversationModel");
const Message = require("../../models/messageModel");
const { normalizeMessage } = require("../../utils/chat");
const {
  findCustomerConversation,
} = require("../../utils/chatIdentity");
const {
  notifyAdmins,
} = require("../../utils/websocketSender");
const logger = require("../../utils/logger");

module.exports = async function sendMessage(req, res) {
  try {
    const messageText = normalizeMessage(
      req.body?.message
    );

    if (!messageText) {
      return res.status(400).json({
        message:
          "Message is required and must not exceed 5000 characters",
        success: false,
        error: true,
      });
    }

    let { conversation, guestId } =
      await findCustomerConversation(req);

    if (!req.userId && !guestId) {
      return res.status(400).json({
        message:
          "A valid guestId is required for guest chat",
        success: false,
        error: true,
      });
    }

    if (!conversation) {
      conversation =
        await Conversation.create({
          userId: req.userId || null,
          guestId,
        });
    }

    const savedMessage =
      await Message.create({
        conversationId:
          conversation._id,
        sender: "USER",
        senderId:
          req.userId || null,
        message: messageText,
      });

    conversation =
      await Conversation.findByIdAndUpdate(
        conversation._id,
        {
          $set: {
            lastMessage: messageText,
            lastMessageAt:
              savedMessage.createdAt,
          },

          $inc: {
            adminUnreadCount: 1,
          },
        },
        {
          new: true,
        }
      );

    /**
     * IMPORTANT:
     * Wait for realtime delivery before
     * returning from Lambda.
     *
     * WebSocket failure must NOT fail
     * the actual saved chat message.
     */
    try {
      await notifyAdmins({
        type: "NEW_MESSAGE",

        conversationId: String(
          conversation._id
        ),

        message: savedMessage,
      });
    } catch (error) {
      logger.warn(
        "websocket_admin_notification_failed",
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
      data: {
        conversation,
        message: savedMessage,
      },

      message: "Message sent",
      success: true,
      error: false,
    });
  } catch (error) {
    logger.error(
      "chat_send_failed",
      {
        errorName: error?.name,
        errorMessage: error?.message,
      }
    );

    return res.status(500).json({
      message:
        "Unable to send message",
      success: false,
      error: true,
    });
  }
};