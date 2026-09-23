import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import {
  parseNaturalLanguage,
  chatWithAdvisor,
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

// @desc    Chat with the AI Financial Advisor
// @route   POST /api/ai/chat
export const chatAdvisor = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    // Fetch live user context
    const [transactions, budgets, goals] = await Promise.all([
      Transaction.find({ userId: req.user._id }).sort({ date: -1 }).limit(50),
      Budget.find({ userId: req.user._id }),
      Goal.find({ userId: req.user._id }),
    ]);

    const reply = await chatWithAdvisor({
      user: req.user,
      transactions,
      budgets,
      goals,
      message,
      history,
    });

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate AI advice" });
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
