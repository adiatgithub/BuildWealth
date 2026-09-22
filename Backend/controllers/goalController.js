import Goal from "../models/Goal.js";

// @desc    Get all goals for user
// @route   GET /api/goals
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const goalsWithProgress = goals.map((g) => {
      const percentage =
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
          : 0;

      return {
        _id: g._id,
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        percentage,
        deadline: g.deadline,
        category: g.category,
        color: g.color,
      };
    });

    res.json(goalsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch goals" });
  }
};

// @desc    Create a new savings goal
// @route   POST /api/goals
export const addGoal = async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline, category, color } = req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({ message: "Title and target amount are required" });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline ? new Date(deadline) : null,
      category: category || "Savings",
      color: color || "#10b981",
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create goal" });
  }
};

// @desc    Deposit / add funds towards a goal
// @route   POST /api/goals/:id/deposit
export const depositToGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Please provide a valid deposit amount" });
    }

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    goal.currentAmount += Number(amount);
    const updated = await goal.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to deposit funds" });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete goal" });
  }
};
