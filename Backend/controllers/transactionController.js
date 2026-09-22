import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

// @desc    Get all transactions with optional filters
// @route   GET /api/transactions
export const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, search, limit = 100 } = req.query;

    const query = { userId: req.user._id };

    if (type && ["income", "expense"].includes(type)) {
      query.type = type;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(Number(limit));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch transactions" });
  }
};

// @desc    Get transaction financial summary & statistics
// @route   GET /api/transactions/stats
export const getTransactionStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate totals by type
    const totals = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    totals.forEach((item) => {
      if (item._id === "income") totalIncome = item.total;
      if (item._id === "expense") totalExpense = item.total;
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    // Breakdown by category for expenses
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format monthly trends for charts
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendsMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      trendsMap[key] = { name: key, income: 0, expense: 0 };
    }

    monthlyTrends.forEach((item) => {
      const mName = monthNames[item._id.month - 1];
      const yName = item._id.year.toString().slice(-2);
      const key = `${mName} ${yName}`;
      if (trendsMap[key]) {
        if (item._id.type === "income") trendsMap[key].income = item.total;
        if (item._id.type === "expense") trendsMap[key].expense = item.total;
      }
    });

    res.json({
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id || "Other",
        amount: c.total,
        count: c.count,
      })),
      monthlyTrends: Object.values(trendsMap),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to calculate stats" });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
export const addTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, paymentMethod, notes, isRecurring } = req.body;

    if (!title || !amount || !type) {
      return res.status(400).json({ message: "Title, amount, and type are required" });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      title,
      amount: Number(amount),
      type,
      category: category || "Other",
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || "Card",
      notes: notes || "",
      isRecurring: Boolean(isRecurring),
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create transaction" });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    Object.assign(transaction, req.body);
    if (req.body.amount) transaction.amount = Number(req.body.amount);
    if (req.body.date) transaction.date = new Date(req.body.date);

    const updated = await transaction.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update transaction" });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete transaction" });
  }
};
