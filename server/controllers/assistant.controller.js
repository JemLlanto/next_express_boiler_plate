const Assistant = require("../models/assistant.model");
const { generateTitle, streamReply } = require("../service/groq.service");

async function getConversations(req, res) {
  const conversations = await Assistant.findById(req.user.user_id);
  // console.log("conversations found in me endpoint:", conversations);
  if (!conversations)
    return res.status(404).json({ message: "Conversations not found" });
  return res.json({
    success: true,
    conversations,
  });
}

// Fetching conversation details and messages by conversationId
async function getConversationDetails(req, res) {
  // Fetch conversation details and messages by conversationId
  const conversationDetails = await Assistant.findByConversationId(
    req.params.conversationId,
  );
  // Fetch messages for the conversation
  const messages = await Assistant.findMessagesByConversationId(
    req.params.conversationId,
  );
  // console.log("conversations found in me endpoint:", conversations);
  if (!conversationDetails)
    return res.status(404).json({ message: "Conversations not found" });
  return res.json({
    success: true,
    conversation: {
      conversation_id: conversationDetails.conversation_id,
      title: conversationDetails.title,
      updated_at: conversationDetails.updated_at,
      messages: messages,
    },
  });
}

async function generateConversationTitle(req, res) {
  try {
    const message = req.body.input;
    const user_id = req.user.user_id;

    console.log(
      "generateConversationTitle called with message:",
      message,
      "user_id:",
      user_id,
    );

    if ((!message, !user_id)) {
      return res
        .status(400)
        .json({ error: "Missing required fields to create a conversation" });
    }

    const title = await generateTitle(message);
    const conversation = await Assistant.createConversation(title, user_id);

    res.status(200).json({
      success: true,
      conversationId: conversation.conversation_id,
      title: conversation.title,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create conversation" });
  }
}

async function generateMessage(req, res) {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res
        .status(400)
        .json({ error: "conversationId and message are required" });
    }

    await Assistant.saveMessage(conversationId, "user", message);
    const history = await Assistant.getMessages(conversationId);
    // console.log(
    //   "history retrieved for conversationId:",
    //   conversationId,
    //   history,
    // );
    const isFirstMessage = history.length === 1;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders();

    const fullReply = await streamReply(history, (chunk) => {
      res.write(chunk);
    });

    console.log("fullReply generated:", fullReply);

    await Assistant.saveMessage(conversationId, "assistant", fullReply);

    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong" });
    } else {
      res.end();
    }
  }
}

module.exports = {
  getConversations,
  getConversationDetails,
  generateConversationTitle,
  generateMessage,
};
