import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/button.jsx";
import { toast } from "sonner";
import {
  Wallet,
  Lock,
  Mail,
  User,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

const AuthPage = () => {
  const location = useLocation();
  const isRegisterInitial = location.pathname === "/register";
  const [isRegister, setIsRegister] = useState(isRegisterInitial);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currency, setCurrency] = useState("$");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login, register, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const strengthCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (strengthCriteria.minLength) score++;
    if (strengthCriteria.hasUpper && strengthCriteria.hasLower) score++;
    if (strengthCriteria.hasNumber) score++;
    if (strengthCriteria.hasSpecial) score++;
    return score;
  }, [strengthCriteria, password]);

  const strengthLabel = useMemo(() => {
    switch (strengthScore) {
      case 0:
        return { text: "Too short", color: "bg-muted text-muted-foreground" };
      case 1:
        return { text: "Weak", color: "bg-rose-500 text-rose-500" };
      case 2:
        return { text: "Fair", color: "bg-amber-500 text-amber-500" };
      case 3:
        return { text: "Good", color: "bg-cyan-500 text-cyan-500" };
      case 4:
        return { text: "Strong", color: "bg-emerald-500 text-emerald-500" };
      default:
        return { text: "", color: "" };
    }
  }, [strengthScore]);

  const passwordsMatch = isRegister ? password === confirmPassword && confirmPassword.length > 0 : true;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      if (strengthScore < 3) {
        toast.error("Please choose a stronger password (at least 8 chars with uppercase, number & symbol)");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ name, email, password, currency, monthlyIncome });
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setSubmitting(true);
    try {
      await loginAsDemo();
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Subtle ambient gradient glows */}
      <div className="absolute top-[10%] left-[25%] w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[25%] w-[400px] h-[400px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20 mb-4 transition-transform hover:scale-105">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {isRegister ? "Create your Account" : "Welcome Back"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            {isRegister
              ? "Start managing your finances with generative AI"
              : "Access your personalized financial dashboard"}
          </p>
        </div>

        {/* Card Box */}
        <div className="rounded-2xl border border-border/80 bg-card/90 dark:bg-card/70 p-6 sm:p-8 shadow-xl backdrop-blur-xl transition-all">
          {/* Quick Demo Button */}
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">Want a quick test?</p>
                <p className="text-[11px] text-muted-foreground">Pre-loads transactions, budgets & AI insights</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={submitting}
              onClick={handleDemo}
              className="bg-background hover:bg-emerald-500 hover:text-white border-emerald-500/40 text-xs font-semibold h-8 shadow-sm"
            >
              Instant Demo
            </Button>
          </div>

          {/* Form Tabs */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                !isRegister ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isRegister ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground">Password</label>
                {isRegister && password && (
                  <span className={`text-[11px] font-bold ${strengthLabel.color.split(" ")[1]}`}>
                    {strengthLabel.text}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter on Registration */}
              {isRegister && password.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  {/* Segmented Strength Bar */}
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-colors ${
                          strengthScore >= step ? strengthLabel.color.split(" ")[0] : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                    <span className={`flex items-center gap-1 ${strengthCriteria.minLength ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {strengthCriteria.minLength ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-60" />}
                      8+ characters
                    </span>
                    <span className={`flex items-center gap-1 ${strengthCriteria.hasUpper ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {strengthCriteria.hasUpper ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-60" />}
                      Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1 ${strengthCriteria.hasNumber ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {strengthCriteria.hasNumber ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-60" />}
                      One number
                    </span>
                    <span className={`flex items-center gap-1 ${strengthCriteria.hasSpecial ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                      {strengthCriteria.hasSpecial ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-60" />}
                      Special character
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (Registration only) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-lg border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && !passwordsMatch
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-border focus:ring-emerald-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
              </div>
            )}

            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="$">$ USD / CAD</option>
                    <option value="₹">₹ INR</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                    <option value="¥">¥ JPY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Monthly Income</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || (isRegister && (!passwordsMatch || strengthScore < 3))}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 mt-2 transition-all active:scale-[0.99]"
            >
              {submitting ? "Processing..." : isRegister ? "Create Secure Account" : "Sign In"}
            </Button>
          </form>

          {/* Security Trust Badges */}
          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 256-Bit SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-cyan-500" /> Salted & Hashed
            </span>
            <span>•</span>
            <span>Rate-Limited</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
