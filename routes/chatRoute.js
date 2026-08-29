const express = require("express");
const optionalAuthToken = require("../middleware/optionalAuthToken");
const sendMessage = require("../controller/chat/sendMessage");
const getConversation = require("../controller/chat/getConversation");
const getMessages = require("../controller/chat/getMessages");
const markMessagesRead = require("../controller/chat/markMessagesRead");

const router = express.Router();

router.post("/chat/message", optionalAuthToken, sendMessage);
router.get("/chat/conversation", optionalAuthToken, getConversation);
router.get("/chat/messages/:conversationId", optionalAuthToken, getMessages);
router.patch("/chat/read/:conversationId", optionalAuthToken, markMessagesRead);

module.exports = router;
