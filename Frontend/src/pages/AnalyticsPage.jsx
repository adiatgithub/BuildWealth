import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import {
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || "$";

  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [statsData, insightsData] = await Promise.all([
          api.getTransactionStats().catch(() => null),
          api.getInsights().catch(() => null),
        ]);
        if (statsData) setStats(statsData);
        if (insightsData) setInsights(insightsData);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const score = insights?.score ?? 75;
  const grade = insights?.grade ?? "B";
  const trendData = stats?.monthlyTrends || [];
  const categoryBreakdown = stats?.categoryBreakdown || [];
  const totalExpense = stats?.totalExpense || 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <TrendingUp className="h-7 w-7 text-emerald-500" />
            Financial Analytics & AI Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Algorithmic health scoring, spending velocity, and predictive optimization.
          </p>
        </div>

        <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
          <Link to="/ai-advisor" className="flex items-center gap-1.5">
            <Bot className="h-4 w-4" />
            Consult AI Advisor
          </Link>
        </Button>
      </div>

      {/* AI HEALTH SCORE & BENCHMARK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Gauge Card */}
        <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Health Audit
            </span>
            <h2 className="text-lg font-bold text-foreground mt-1">Financial Fitness Score</h2>
            <p className="text-xs text-muted-foreground">Computed from savings velocity, debt balance & budget compliance.</p>
          </div>

          <div className="my-6 text-center">
            <div className="inline-flex flex-col items-center justify-center h-36 w-36 rounded-full border-4 border-emerald-500/30 bg-emerald-500/10 shadow-inner">
              <span className="text-4xl font-extrabold text-foreground">{score}</span>
              <span className="text-xs font-semibold text-emerald-500">Grade: {grade}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {score >= 80 ? "Excellent Financial Discipline" : score >= 65 ? "Good — Optimization Opportunities Available" : "Caution — Review Non-Essential Expenses"}
            </p>
          </div>

          <div className="pt-4 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
            <div className="flex justify-between">
              <span>Savings Rate:</span>
              <span className="font-semibold text-foreground">{stats?.savingsRate ?? 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Net Liquidity:</span>
              <span className="font-semibold text-foreground">{currency}{(stats?.netBalance ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* AI Actionable Recommendations */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Algorithmic Recommendations</h2>
            <p className="text-xs text-muted-foreground">Tailored advice generated directly from your financial behavior</p>
          </div>

          <div className="space-y-3.5 my-4">
            {insights?.insights?.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-left ${
                  item.type === "positive"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : item.type === "warning"
                    ? "bg-rose-500/10 border-rose-500/30"
                    : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.type === "positive" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : item.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                  <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-xs font-semibold text-foreground mt-1.5">
                  💡 Recommendation: {item.action}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <Link to="/ai-advisor" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-400">
              Discuss with AI Advisor in Real-Time <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 6-MONTH CASHFLOW CHART */}
      <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-bold text-foreground">6-Month Cash Flow Trajectory</h2>
          <p className="text-xs text-muted-foreground">Historical comparison of inflow vs. outflow</p>
        </div>

        <div className="h-[300px] w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", borderColor: "#334155", borderRadius: "8px" }}
                  formatter={(val) => `${currency}${val.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No trend data recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY SPENDING TABLE */}
      <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-bold text-foreground">Category Spend Concentration</h2>
          <p className="text-xs text-muted-foreground">Detailed ranking of where capital is deployed</p>
        </div>

        {categoryBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Transactions</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4 text-right">% of Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {categoryBreakdown.map((item) => {
                  const pct = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                  return (
                    <tr key={item.category} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{item.category}</td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">{item.count}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-500">
                        {currency}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-foreground">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No expenses logged yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
