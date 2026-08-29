const Conversation = require("../../models/conversationModel");
const { isObjectId } = require("../../utils/chat");

module.exports = async function updateConversationStatus(req, res) {
  try {
    const { conversationId } = req.params;
    const status = String(req.body?.status || "").toUpperCase();
    if (!isObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId", success: false, error: true });
    }
    if (!["OPEN", "CLOSED"].includes(status)) {
      return res.status(400).json({ message: "Status must be OPEN or CLOSED", success: false, error: true });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found", success: false, error: true });
    }

    return res.json({ data: conversation, message: `Conversation ${status.toLowerCase()}`, success: true, error: false });
  } catch {
    return res.status(500).json({ message: "Unable to update conversation", success: false, error: true });
  }
};
