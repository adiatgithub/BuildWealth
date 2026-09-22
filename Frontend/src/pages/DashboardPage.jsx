import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { Button } from "../components/ui/button.jsx";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Sparkles,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Calendar,
  CreditCard,
  PieChart as PieIcon,
  Bot,
  Trash2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#cc983eff", "#ec4899", "#06b6d4", "#64748b"];

const DashboardPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || "$";

  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Food & Dining",
    paymentMethod: "Card",
    date: new Date().toISOString().split("T")[0],
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, txData, insightsData] = await Promise.all([
        api.getTransactionStats().catch(() => null),
        api.getTransactions({ limit: 6 }).catch(() => []),
        api.getInsights().catch(() => null),
      ]);

      if (statsData) setStats(statsData);
      if (txData) setRecentTransactions(txData);
      if (insightsData) setInsights(insightsData);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAiParse = async () => {
    if (!aiText.trim()) {
      toast.error("Please enter a sentence to parse (e.g. 'Spent $45 on groceries')");
      return;
    }
    setAiParsing(true);
    try {
      const parsed = await api.parseTransaction(aiText);
      setFormData((prev) => ({
        ...prev,
        title: parsed.title || prev.title,
        amount: parsed.amount ? String(parsed.amount) : prev.amount,
        type: parsed.type || prev.type,
        category: parsed.category || prev.category,
        paymentMethod: parsed.paymentMethod || prev.paymentMethod,
        date: parsed.date || prev.date,
      }));
      toast.success("AI parsed transaction details!");
    } catch (err) {
      toast.error("AI parsing failed: " + err.message);
    } finally {
      setAiParsing(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      toast.error("Title and amount are required");
      return;
    }

    try {
      await api.addTransaction(formData);
      toast.success("Transaction added successfully!");
      setIsModalOpen(false);
      setFormData({
        title: "",
        amount: "",
        type: "expense",
        category: "Food & Dining",
        paymentMethod: "Card",
        date: new Date().toISOString().split("T")[0],
      });
      setAiText("");
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || "Failed to add transaction");
    }
  };

  const handleDeleteTx = async (id) => {
    try {
      await api.deleteTransaction(id);
      toast.success("Transaction deleted");
      loadDashboardData();
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  const totalBalance = stats?.netBalance ?? 0;
  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpense = stats?.totalExpense ?? 0;
  const savingsRate = stats?.savingsRate ?? 0;

  const categoryData = (stats?.categoryBreakdown || []).map((item) => ({
    name: item.category,
    value: item.amount,
  }));

  const trendData = stats?.monthlyTrends || [];

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Financial Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.name || "Member"}. Real-time analytics & AI insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Transaction
          </Button>

          <Button variant="outline" asChild>
            <Link to="/ai-advisor" className="flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-emerald-500" />
              Ask AI Advisor
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Smart Insight Alert Banner */}
      {insights?.insights?.[0] && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                  AI Financial Health Score: {insights.score}/100 ({insights.grade})
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {insights.insights[0].title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {insights.insights[0].description} — <span className="text-foreground font-medium">{insights.insights[0].action}</span>
              </p>
            </div>
          </div>

          <Button size="sm" variant="outline" className="shrink-0 text-xs font-semibold" asChild>
            <Link to="/analytics">View Full Audit</Link>
          </Button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Net Balance</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
            {currency}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Available liquid net worth</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Inflow</span>
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">
            +{currency}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">All recorded earnings</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Outflow</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-500 mt-2">
            -{currency}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total expenses recorded</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Savings Rate</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-cyan-500 mt-2">
            {savingsRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Target benchmark: 20%+</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trend Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Cash Flow Activity</h2>
              <p className="text-xs text-muted-foreground">Income vs. Expenses across recent months</p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", borderColor: "#334155", borderRadius: "8px" }}
                    formatter={(value) => `${currency}${value.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No cash flow records yet. Add a transaction to view trends.
              </div>
            )}
          </div>
        </div>

        {/* Category Expense Donut Chart */}
        <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Expense Distribution</h2>
            <p className="text-xs text-muted-foreground">Category breakdown of total spend</p>
          </div>

          <div className="h-[200px] w-full my-auto">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", borderColor: "#334155", borderRadius: "8px" }}
                    formatter={(value) => `${currency}${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No expense categories yet.
              </div>
            )}
          </div>

          {/* Top categories legend */}
          <div className="space-y-1.5 pt-3 border-t border-border/60">
            {categoryData.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="font-semibold text-foreground">
                  {currency}{item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground">Latest financial movements recorded</p>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions" className="flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-border/60">
            {recentTransactions.map((tx) => (
              <div key={tx._id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${tx.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      }`}
                  >
                    {tx.type === "income" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tx.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted font-medium">{tx.category}</span>
                      <span>•</span>
                      <span>{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm sm:text-base font-bold ${tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                  >
                    {tx.type === "income" ? "+" : "-"}{currency}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => handleDeleteTx(tx._id)}
                    className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                    title="Delete transaction"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No transactions yet. Click "+ Add Transaction" or use Instant Demo to populate data!
          </div>
        )}
      </div>

      {/* QUICK ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Add New Transaction</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {/* AI Magic Entry Box */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                <Sparkles className="h-3.5 w-3.5" />
                AI Smart Quick-Entry
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="e.g. Spent $62 on groceries at Trader Joe's"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                />
                <Button
                  size="sm"
                  type="button"
                  disabled={aiParsing}
                  onClick={handleAiParse}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                >
                  {aiParsing ? "Parsing..." : "Auto-Fill"}
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description / Merchant</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chipotle Dinner"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Housing">Housing</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Salary">Salary</option>
                    <option value="Investments">Investments</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                  >
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Crypto">Crypto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  Save Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
