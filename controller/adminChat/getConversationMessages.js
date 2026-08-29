const Conversation = require("../../models/conversationModel");
const Message = require("../../models/messageModel");
const { isObjectId, getPagination } = require("../../utils/chat");

module.exports = async function getConversationMessages(req, res) {
  try {
    const { conversationId } = req.params;
    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId", success: false, error: true });
    }

    const conversation = await Conversation.findById(conversationId).populate("userId", "name email");
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found", success: false, error: true });
    }

    const { page, limit, skip } = getPagination(req.query);
    const readAt = new Date();
    const [messages, total] = await Promise.all([
      Message.find({ conversationId }).sort({ createdAt: 1 }).skip(skip).limit(limit),
      Message.countDocuments({ conversationId }),
      Message.updateMany(
        { conversationId, sender: "USER", isRead: false },
        { $set: { isRead: true, readAt } }
      ),
      Conversation.updateOne({ _id: conversationId }, { $set: { adminUnreadCount: 0 } }),
    ]);

    conversation.adminUnreadCount = 0;
    return res.json({
      data: { conversation, messages, pagination: { page, limit, total } },
      success: true,
      error: false,
    });
  } catch {
    return res.status(500).json({ message: "Unable to get messages", success: false, error: true });
  }
};
