const express = require("express");
const authToken = require("../middleware/authToken");
const isAdmin = require("../middleware/isAdmin");
const getConversations = require("../controller/adminChat/getConversations");
const getConversationMessages = require("../controller/adminChat/getConversationMessages");
const sendAdminMessage = require("../controller/adminChat/sendAdminMessage");
const markAdminMessagesRead = require("../controller/adminChat/markAdminMessagesRead");
const updateConversationStatus = require("../controller/adminChat/updateConversationStatus");

const router = express.Router();

router.use("/admin/chat", authToken, isAdmin);
router.get("/admin/chat/conversations", getConversations);
router.get("/admin/chat/messages/:conversationId", getConversationMessages);
router.post("/admin/chat/message", sendAdminMessage);
router.patch("/admin/chat/read/:conversationId", markAdminMessagesRead);
router.patch("/admin/chat/conversation/:conversationId/status", updateConversationStatus);

module.exports = router;
