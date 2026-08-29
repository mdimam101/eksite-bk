const Conversation = require("../../models/conversationModel");
const Message = require("../../models/messageModel");
const { isObjectId } = require("../../utils/chat");
const { getGuestId, customerOwnsConversation } = require("../../utils/chatIdentity");

module.exports = async function markMessagesRead(req, res) {
  try {
    const { conversationId } = req.params;
    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId", success: false, error: true });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found", success: false, error: true });
    }
    if (!(await customerOwnsConversation(conversation, req, getGuestId(req)))) {
      return res.status(403).json({ message: "Conversation access denied", success: false, error: true });
    }

    const readAt = new Date();
    await Promise.all([
      Message.updateMany(
        { conversationId, sender: "ADMIN", isRead: false },
        { $set: { isRead: true, readAt } }
      ),
      Conversation.updateOne({ _id: conversationId }, { $set: { userUnreadCount: 0 } }),
    ]);

    return res.json({ data: { conversationId, readAt }, message: "Messages marked as read", success: true, error: false });
  } catch {
    return res.status(500).json({ message: "Unable to mark messages as read", success: false, error: true });
  }
};
