const Conversation = require("../../models/conversationModel");
const Message = require("../../models/messageModel");
const { isObjectId } = require("../../utils/chat");

module.exports = async function markAdminMessagesRead(req, res) {
  try {
    const { conversationId } = req.params;
    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId", success: false, error: true });
    }
    if (!(await Conversation.exists({ _id: conversationId }))) {
      return res.status(404).json({ message: "Conversation not found", success: false, error: true });
    }

    const readAt = new Date();
    await Promise.all([
      Message.updateMany(
        { conversationId, sender: "USER", isRead: false },
        { $set: { isRead: true, readAt } }
      ),
      Conversation.updateOne({ _id: conversationId }, { $set: { adminUnreadCount: 0 } }),
    ]);

    return res.json({ data: { conversationId, readAt }, message: "Messages marked as read", success: true, error: false });
  } catch {
    return res.status(500).json({ message: "Unable to mark messages as read", success: false, error: true });
  }
};
