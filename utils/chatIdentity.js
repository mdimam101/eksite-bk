const Conversation = require("../models/conversationModel");
const { normalizeGuestId } = require("./chat");

function getGuestId(req) {
  return normalizeGuestId(req.body?.guestId || req.query?.guestId || req.headers["x-guest-id"]);
}

async function findCustomerConversation(req, { openOnly = true } = {}) {
  const guestId = getGuestId(req);
  const status = openOnly ? { status: "OPEN" } : {};

  if (req.userId) {
    const byUser = await Conversation.findOne({ userId: req.userId, ...status });
    if (byUser) return { conversation: byUser, guestId };

    if (guestId) {
      const guestConversation = await Conversation.findOne({
        guestId,
        userId: null,
        ...status,
      });
      if (guestConversation) {
        guestConversation.userId = req.userId;
        await guestConversation.save();
        return { conversation: guestConversation, guestId };
      }
    }

    return { conversation: null, guestId };
  }

  if (!guestId) return { conversation: null, guestId: null };
  const conversation = await Conversation.findOne({ guestId, userId: null, ...status });
  return { conversation, guestId };
}

async function customerOwnsConversation(conversation, req, guestId) {
  if (req.userId) {
    if (String(conversation.userId || "") === String(req.userId)) return true;
    if (!conversation.userId && guestId && conversation.guestId === guestId) {
      conversation.userId = req.userId;
      await conversation.save();
      return true;
    }
    return false;
  }
  return Boolean(guestId && !conversation.userId && conversation.guestId === guestId);
}

module.exports = { getGuestId, findCustomerConversation, customerOwnsConversation };
