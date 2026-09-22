import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { Button } from "../components/ui/button.jsx";
import { toast } from "sonner";
import {
  ReceiptText,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Sparkles,
  Calendar,
  CreditCard,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Food & Dining",
  "Housing",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Salary",
  "Investments",
  "Other",
];

const TransactionsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || "$";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal State
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
    notes: "",
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      if (categoryFilter !== "All") params.category = categoryFilter;

      const data = await api.getTransactions(params);
      setTransactions(data);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) {
      toast.error("Please enter a sentence to parse");
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.addTransaction(formData);
      toast.success("Transaction added!");
      setIsModalOpen(false);
      setFormData({
        title: "",
        amount: "",
        type: "expense",
        category: "Food & Dining",
        paymentMethod: "Card",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setAiText("");
      fetchTransactions();
    } catch (err) {
      toast.error(err.message || "Failed to add transaction");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTransaction(id);
      toast.success("Transaction removed");
      setTransactions((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const headers = ["Title", "Type", "Category", "Amount", "Currency", "Date", "PaymentMethod", "Notes"];
    const rows = transactions.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      t.category,
      t.amount,
      currency,
      new Date(t.date).toISOString().split("T")[0],
      t.paymentMethod,
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transactions exported to CSV!");
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Transactions History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage, filter, and audit your personal transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs font-semibold">
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by merchant or title..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter Buttons */}
          <div className="flex rounded-lg bg-muted p-1 text-xs font-medium">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1 rounded-md transition-all ${
                typeFilter === "all" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("income")}
              className={`px-3 py-1 rounded-md transition-all ${
                typeFilter === "income" ? "bg-emerald-600 text-white shadow-sm font-semibold" : "text-muted-foreground"
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setTypeFilter("expense")}
              className={`px-3 py-1 rounded-md transition-all ${
                typeFilter === "expense" ? "bg-rose-600 text-white shadow-sm font-semibold" : "text-muted-foreground"
              }`}
            >
              Expenses
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Loading transactions...
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Merchant / Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2.5">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {tx.type === "income" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p>{tx.title}</p>
                        {tx.notes && <p className="text-xs text-muted-foreground font-normal">{tx.notes}</p>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                        {tx.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {tx.paymentMethod}
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-bold text-base ${
                        tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}{currency}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(tx._id)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No transactions found matching your filters.
          </div>
        )}
      </div>

      {/* QUICK ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Add Transaction</h3>
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
                  placeholder="e.g. Spent $32 on subway transit this morning"
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

            <form onSubmit={handleCreate} className="space-y-4">
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
                  placeholder="e.g. Grocery Store"
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
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
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

export default TransactionsPage;
