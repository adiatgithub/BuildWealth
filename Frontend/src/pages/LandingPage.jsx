import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/button.jsx";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  PieChart,
  Bot,
  CheckCircle2,
  Lock,
  Wallet,
  Coins,
  ChevronRight,
} from "lucide-react";

const LandingPage = () => {
  const { isAuthenticated, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    await loginAsDemo();
    navigate("/dashboard");
  };

  return (
    <div className="relative overflow-hidden">
      {/* Glow gradient backdrops */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[25%] right-[10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-8 backdrop-blur-sm animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation AI Wealth Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
            Master Your Money with{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Autonomous AI
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop manual spreadsheets. BuildWealth.AI uses deep financial intelligence to categorize spending, predict cashflow, audit budgets, and coach you toward financial independence.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
                asChild
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  Go to Your Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 font-semibold"
                  asChild
                >
                  <Link to="/register" className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDemoClick}
                  className="w-full sm:w-auto h-12 px-8 text-base border-emerald-500/40 hover:bg-emerald-500/10 text-foreground font-semibold flex items-center gap-2"
                >
                  <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                  Instant Live Demo
                </Button>
              </>
            )}
          </div>

          {/* Feature Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Free to Start
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Bank-Grade Privacy & Encryption
            </span>
          </div>

          {/* HERO PREVIEW DASHBOARD CARD */}
          <div className="mt-16 relative rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 shadow-2xl backdrop-blur-xl max-w-5xl mx-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">buildwealth.ai/app</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
                <Bot className="h-3.5 w-3.5" /> AI Health Score: 88/100 (Optimal)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-background/70 border border-border/40">
                <p className="text-xs text-muted-foreground font-medium">Total Net Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">$28,450.00</p>
                <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +14.2% from last month
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background/70 border border-border/40">
                <p className="text-xs text-muted-foreground font-medium">Monthly Inflow</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-500 mt-1">+$7,350.00</p>
                <p className="text-xs text-muted-foreground mt-1">Salary & Consulting</p>
              </div>

              <div className="p-4 rounded-xl bg-background/70 border border-border/40">
                <p className="text-xs text-muted-foreground font-medium">Monthly Outflow</p>
                <p className="text-2xl sm:text-3xl font-bold text-rose-500 mt-1">-$3,180.50</p>
                <p className="text-xs text-emerald-500 font-medium mt-1">Savings Rate: 56%</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    AI Spending Recommendation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    "You have spent 22% less on dining this week. Moving $200 surplus into your 'Japan Trip' goal will hit your target 3 weeks early."
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="hidden sm:flex" asChild>
                <Link to="/ai-advisor">Chat with AI</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section id="features" className="py-20 border-t border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
              Complete Financial Superpowers
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-foreground mt-2">
              Engineered for Wealth Creation
            </p>
            <p className="text-muted-foreground mt-3">
              Everything you need to monitor, analyze, and optimize your personal net worth in one unified dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Natural Language Quick-Add</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Type naturally like <span className="italic text-foreground">"Spent $54 on dinner at Chipotle yesterday"</span> and AI fills category, date, and amounts instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-teal-500/40 transition-all hover:shadow-xl hover:shadow-teal-500/5 group">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">24/7 AI Financial Advisor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask tailored questions about your spending patterns, get personalized 50/30/20 budget allocations, and uncover hidden savings opportunities.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-cyan-500/40 transition-all hover:shadow-xl hover:shadow-cyan-500/5 group">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <PieChart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Visual Cash Flow & Budgets</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dynamic category breakdown donut charts, monthly income vs expense trends, and real-time over-budget warning thresholds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Savings Goals with Progress</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set milestones for emergency funds, vacations, or real estate down payments with visual completion bars and target countdowns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI CAPABILITIES DEEP DIVE */}
      <section id="ai" className="py-20 border-t border-border/40">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Generative Financial Intelligence
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                Your Personal AI Wealth Strategist
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Unlike generic financial apps that merely show graphs, BuildWealth.AI acts as a tireless financial planner that understands your unique lifestyle and income.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Automated Financial Health Audit</h4>
                    <p className="text-xs text-muted-foreground">Generates a dynamic 0-100 score analyzing savings velocity and debt-to-income balance.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Leak Detection & Subscription Auditing</h4>
                    <p className="text-xs text-muted-foreground">Pinpoints recurring subscriptions and flags lifestyle creep before it hurts your net worth.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Contextual Wealth Advisory</h4>
                    <p className="text-xs text-muted-foreground">Directly chat with your data to solve complex questions: "Can I afford a $1,200 vacation next month?"</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={handleDemoClick}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Try the AI Advisor Live
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Chat Mockup */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">BuildWealth AI Advisor</h4>
                  <p className="text-xs text-emerald-500 font-medium">Active • Connected to your finances</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3.5 rounded-xl bg-muted/60 max-w-[85%] ml-auto text-foreground font-medium">
                  "How can I cut expenses by $300 this month to fund my emergency goal?"
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-[90%] text-foreground space-y-2">
                  <p className="font-semibold text-emerald-500 text-xs uppercase tracking-wider">AI Recommendation Plan:</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    1. <strong>Dining Out:</strong> You spent $640 on food delivery last month. Setting a $450 limit saves <strong>$190</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    2. <strong>Subscriptions:</strong> You have 4 streaming apps ($68 total). Pausing two saves <strong>$34</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    3. <strong>Ride Sharing:</strong> 6 short Uber rides ($82 total) can be swapped for transit, saving <strong>$55</strong>.
                  </p>
                  <p className="text-xs font-semibold text-emerald-500 pt-1">
                    Total Projected Savings: $279/month.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 border-t border-border/40 bg-gradient-to-b from-background to-emerald-950/20 text-center">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground">
            Start Building Wealth Intelligently Today
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of users who have automated their financial clarity and accelerated their savings goals with AI.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 font-semibold"
              asChild
            >
              <Link to="/register">Create Free Account</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleDemoClick}
              className="w-full sm:w-auto h-12 px-8 text-base font-semibold"
            >
              Explore Demo Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
