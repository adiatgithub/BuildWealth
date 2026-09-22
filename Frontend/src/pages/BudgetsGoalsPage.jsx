import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { Button } from "../components/ui/button.jsx";
import { toast } from "sonner";
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Target,
  Calendar,
  Coins,
  DollarSign,
} from "lucide-react";

const CATEGORIES = [
  "Food & Dining",
  "Housing",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Other",
];

const BudgetsGoalsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || "$";

  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Budget Modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: "Food & Dining", limitAmount: "" });

  // Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "0",
    deadline: "",
    category: "Savings",
    color: "#10b981",
  });

  // Deposit Modal
  const [depositGoalId, setDepositGoalId] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, goalsData] = await Promise.all([
        api.getBudgets().catch(() => []),
        api.getGoals().catch(() => []),
      ]);
      setBudgets(budgetsData);
      setGoals(goalsData);
    } catch (err) {
      toast.error("Failed to load budgets and goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      await api.setBudget(budgetForm);
      toast.success("Budget updated!");
      setIsBudgetModalOpen(false);
      setBudgetForm({ category: "Food & Dining", limitAmount: "" });
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to set budget");
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await api.deleteBudget(id);
      toast.success("Budget removed");
      loadData();
    } catch (err) {
      toast.error("Failed to delete budget");
    }
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      await api.addGoal(goalForm);
      toast.success("Savings Goal created!");
      setIsGoalModalOpen(false);
      setGoalForm({
        title: "",
        targetAmount: "",
        currentAmount: "0",
        deadline: "",
        category: "Savings",
        color: "#10b981",
      });
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create goal");
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    try {
      await api.depositToGoal(depositGoalId, Number(depositAmount));
      toast.success("Funds added to goal!");
      setDepositGoalId(null);
      setDepositAmount("");
      loadData();
    } catch (err) {
      toast.error("Failed to deposit funds");
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await api.deleteGoal(id);
      toast.success("Goal removed");
      loadData();
    } catch (err) {
      toast.error("Failed to delete goal");
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* SECTION 1: CATEGORY BUDGETS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
              <PiggyBank className="h-7 w-7 text-emerald-500" />
              Monthly Category Budgets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set spending thresholds per category and receive automated warning alerts.
            </p>
          </div>

          <Button
            onClick={() => setIsBudgetModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Set Budget
          </Button>
        </div>

        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b) => {
              const isOver = b.isOverBudget;
              const isWarning = b.percentage >= 80 && !isOver;

              return (
                <div
                  key={b._id}
                  className={`p-5 rounded-2xl bg-card border transition-all ${
                    isOver
                      ? "border-rose-500/50 bg-rose-500/5 shadow-rose-500/5"
                      : isWarning
                      ? "border-amber-500/50 bg-amber-500/5 shadow-amber-500/5"
                      : "border-border/70 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-base">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isOver
                            ? "bg-rose-500/20 text-rose-500"
                            : isWarning
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-emerald-500/20 text-emerald-500"
                        }`}
                      >
                        {isOver ? "Over Budget" : isWarning ? "Near Limit" : "On Track"}
                      </span>
                      <button
                        onClick={() => handleDeleteBudget(b._id)}
                        className="text-muted-foreground hover:text-rose-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">
                      Spent: <strong className="text-foreground">{currency}{b.spent.toLocaleString()}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Limit: <strong className="text-foreground">{currency}{b.limitAmount.toLocaleString()}</strong>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{b.percentage}% Used</span>
                    <span>
                      {isOver
                        ? `Exceeded by ${currency}${(b.spent - b.limitAmount).toLocaleString()}`
                        : `${currency}${b.remaining.toLocaleString()} left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
            No category budgets created yet. Click "+ Set Budget" to establish your monthly spending limits!
          </div>
        )}
      </div>

      {/* SECTION 2: SAVINGS GOALS */}
      <div className="space-y-6 pt-6 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
              <Target className="h-7 w-7 text-cyan-500" />
              Target Savings Goals
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track emergency reserves, vacation funds, and long-term milestones.
            </p>
          </div>

          <Button
            onClick={() => setIsGoalModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Goal
          </Button>
        </div>

        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((g) => (
              <div
                key={g._id}
                className="p-5 rounded-2xl bg-card border border-border/70 hover:border-cyan-500/40 transition-all shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: g.color || "#10b981" }}
                    />
                    <h3 className="font-bold text-foreground text-base">{g.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(g._id)}
                    className="text-muted-foreground hover:text-rose-500 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-2xl font-extrabold text-foreground">
                      {currency}{g.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      Target: {currency}{g.targetAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${g.percentage}%`,
                        backgroundColor: g.color || "#10b981",
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{g.percentage}% completed</span>
                    {g.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(g.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDepositGoalId(g._id)}
                    className="w-full text-xs font-semibold hover:bg-cyan-500/10 hover:text-cyan-500 border-cyan-500/30"
                  >
                    <Coins className="h-3.5 w-3.5 mr-1.5 text-cyan-500" />
                    + Deposit Funds
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
            No savings goals yet. Create a goal like "Emergency Reserve" or "Dream Vacation" to track your progress!
          </div>
        )}
      </div>

      {/* MODAL: SET BUDGET */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Set Category Budget</h3>
              <button onClick={() => setIsBudgetModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                <select
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Monthly Limit ({currency})</label>
                <input
                  type="number"
                  required
                  value={budgetForm.limitAmount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, limitAmount: e.target.value })}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="outline" type="button" onClick={() => setIsBudgetModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  Save Budget
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE GOAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Savings Goal</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g. Emergency Fund (6 Months)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target ({currency})</label>
                  <input
                    type="number"
                    required
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                    placeholder="10000"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Initial Saved ({currency})</label>
                  <input
                    type="number"
                    value={goalForm.currentAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="outline" type="button" onClick={() => setIsGoalModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Create Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DEPOSIT FUNDS */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Deposit Savings</h3>
            <p className="text-xs text-muted-foreground">Add funds toward this milestone goal.</p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Deposit Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="outline" type="button" onClick={() => setDepositGoalId(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  Confirm Deposit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsGoalsPage;
