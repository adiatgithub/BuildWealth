import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

// @desc    Get all budgets with live spending status
// @route   GET /api/budgets
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch user budgets
    const budgets = await Budget.find({ userId });

    // Aggregate expenses for this month grouped by category
    const spendingAgg = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: "expense",
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$category",
          spent: { $sum: "$amount" },
        },
      },
    ]);

    const spendingMap = {};
    spendingAgg.forEach((s) => {
      spendingMap[s._id] = s.spent;
    });

    const budgetsWithProgress = budgets.map((b) => {
      const spent = spendingMap[b.category] || 0;
      const remaining = Math.max(0, b.limitAmount - spent);
      const percentage = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;

      return {
        _id: b._id,
        category: b.category,
        limitAmount: b.limitAmount,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > b.limitAmount,
      };
    });

    res.json(budgetsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch budgets" });
  }
};

// @desc    Create or update a category budget
// @route   POST /api/budgets
export const setBudget = async (req, res) => {
  try {
    const { category, limitAmount } = req.body;

    if (!category || limitAmount === undefined) {
      return res.status(400).json({ message: "Category and limit amount are required" });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category },
      { limitAmount: Number(limitAmount) },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to set budget" });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete budget" });
  }
};
