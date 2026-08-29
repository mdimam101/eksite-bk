const Conversation = require("../../models/conversationModel");
const Message = require("../../models/messageModel");
const { isObjectId, getPagination } = require("../../utils/chat");
const { getGuestId, customerOwnsConversation } = require("../../utils/chatIdentity");

module.exports = async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId", success: false, error: true });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found", success: false, error: true });
    }

    const guestId = getGuestId(req);
    if (!(await customerOwnsConversation(conversation, req, guestId))) {
      return res.status(403).json({ message: "Conversation access denied", success: false, error: true });
    }

    const { page, limit, skip } = getPagination(req.query);
    const [messages, total] = await Promise.all([
      Message.find({ conversationId }).sort({ createdAt: 1 }).skip(skip).limit(limit),
      Message.countDocuments({ conversationId }),
    ]);

    return res.json({
      data: { conversation, messages, pagination: { page, limit, total } },
      success: true,
      error: false,
    });
  } catch {
    return res.status(500).json({ message: "Unable to get messages", success: false, error: true });
  }
};
