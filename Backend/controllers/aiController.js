import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import {
  parseNaturalLanguage,
  chatWithAdvisor,
  streamAdvisor,
  generateFinancialAudit,
} from "../services/aiService.js";

// @desc    Parse natural language text into a structured transaction
// @route   POST /api/ai/parse-transaction
export const parseTransaction = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Text input is required" });
    }

    const parsed = await parseNaturalLanguage(text);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to parse transaction" });
  }
};

// @desc    Chat with the AI Financial Advisor (JSON request-response)
// @route   POST /api/ai/chat
export const chatAdvisor = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    // Fetch live user financial context
    const [transactions, budgets, goals] = await Promise.all([
      Transaction.find({ userId: req.user._id }).sort({ date: -1 }).limit(50),
      Budget.find({ userId: req.user._id }),
      Goal.find({ userId: req.user._id }),
    ]);

    const result = await chatWithAdvisor({
      user: req.user,
      transactions,
      budgets,
      goals,
      message,
      history,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate AI advice" });
  }
};

// @desc    Real-time streaming Chat with AI Financial Advisor (Server-Sent Events)
// @route   POST /api/ai/chat-stream
export const streamChatAdvisor = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    // Configure Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    // Fetch live user financial context
    const [transactions, budgets, goals] = await Promise.all([
      Transaction.find({ userId: req.user._id }).sort({ date: -1 }).limit(50),
      Budget.find({ userId: req.user._id }),
      Goal.find({ userId: req.user._id }),
    ]);

    const result = await streamAdvisor({
      user: req.user,
      transactions,
      budgets,
      goals,
      message,
      history,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
    });

    res.write(`data: ${JSON.stringify({ done: true, reply: result.reply, actionChips: result.actionChips })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Stream advisor error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "Failed to stream advice" });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "Streaming interrupted" })}\n\n`);
      res.end();
    }
  }
};

// @desc    Get AI Financial Health Score & Audit Insights
// @route   GET /api/ai/insights
export const getInsights = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
    const budgets = await Budget.find({ userId: req.user._id });

    const audit = generateFinancialAudit({
      user: req.user,
      transactions,
      budgets,
    });

    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate financial audit" });
  }
};
