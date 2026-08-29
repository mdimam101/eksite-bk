const Conversation = require("../../models/conversationModel");
const { getPagination } = require("../../utils/chat");

module.exports = async function getConversations(req, res) {
  try {
    const filter = {};
    const status = String(req.query.status || "").toUpperCase();
    if (status && !["OPEN", "CLOSED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status filter", success: false, error: true });
    }
    if (status) filter.status = status;
    if (String(req.query.unread).toLowerCase() === "true") filter.adminUnreadCount = { $gt: 0 };

    const { page, limit, skip } = getPagination(req.query);
    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate("userId", "name email")
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    const data = conversations.map((conversation) => ({
      ...conversation,
      guestDisplayName: conversation.userId
        ? null
        : `Guest #${String(conversation.guestId || "UNKNOWN").slice(-6).toUpperCase()}`,
    }));

    return res.json({ data, pagination: { page, limit, total }, success: true, error: false });
  } catch {
    return res.status(500).json({ message: "Unable to get conversations", success: false, error: true });
  }
};
