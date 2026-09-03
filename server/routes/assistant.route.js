const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  getConversations,
  getConversationDetails,
  generateConversationTitle,
  generateMessage,
} = require("../controllers/assistant.controller");

const router = express.Router();

router.post("/conversation", requireAuth, generateConversationTitle);
router.get("/conversation", requireAuth, getConversations);
router.get(
  "/conversation/:conversationId",
  requireAuth,
  getConversationDetails,
);
router.post("/chat", requireAuth, generateMessage);

module.exports = router;
