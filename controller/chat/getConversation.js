const { findCustomerConversation } = require("../../utils/chatIdentity");

module.exports = async function getConversation(req, res) {
  try {
    const { conversation, guestId } = await findCustomerConversation(req);
    if (!req.userId && !guestId) {
      return res.status(400).json({
        message: "A valid guestId is required for guest chat",
        success: false,
        error: true,
      });
    }

    return res.json({
      data: conversation,
      message: conversation ? "Conversation found" : "No open conversation",
      success: true,
      error: false,
    });
  } catch {
    return res.status(500).json({ message: "Unable to get conversation", success: false, error: true });
  }
};
