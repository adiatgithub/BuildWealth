import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
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
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem("buildwealth_remember_email") === "true");
  });
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  const { login, register, loginAsDemo, backendStatus, checkBackendHealth } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("buildwealth_remembered_email");
    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
  }, []);

  // Sync state with URL if user navigates back/forward
  useEffect(() => {
    setIsRegister(location.pathname === "/register");
  }, [location.pathname]);

  // Caps lock detection on keydown/keyup
  const handleKeyDetection = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

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
        return { text: "Too short", color: "bg-muted text-muted-foreground", ariaText: "Password strength: Too short" };
      case 1:
        return { text: "Weak", color: "bg-rose-500 text-rose-500", ariaText: "Password strength: Weak" };
      case 2:
        return { text: "Fair", color: "bg-amber-500 text-amber-500", ariaText: "Password strength: Fair" };
      case 3:
        return { text: "Good", color: "bg-cyan-500 text-cyan-500", ariaText: "Password strength: Good. Meets security policy." };
      case 4:
        return { text: "Strong (Bank Grade)", color: "bg-emerald-500 text-emerald-500", ariaText: "Password strength: Strong. Bank grade protection." };
      default:
        return { text: "", color: "", ariaText: "" };
    }
  }, [strengthScore]);

  const passwordsMatch = isRegister ? password === confirmPassword && confirmPassword.length > 0 : true;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      if (strengthScore < 3) {
        toast.error("Please create a stronger password (at least 8 chars with uppercase, number & symbol)");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match. Please verify your re-typed password.");
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

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem("buildwealth_remember_email", "true");
        localStorage.setItem("buildwealth_remembered_email", email.trim());
      } else {
        localStorage.removeItem("buildwealth_remember_email");
        localStorage.removeItem("buildwealth_remembered_email");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Authentication error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setSubmitting(true);
    try {
      await loginAsDemo();
      navigate("/dashboard");
    } catch (err) {
      console.error("Demo login error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTab = (registerMode) => {
    setIsRegister(registerMode);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 relative">
      {/* Subtle ambient lighting glows */}
      <div className="absolute top-[10%] left-[20%] w-[420px] h-[420px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[420px] h-[420px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/25 mb-3 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="BuildWealth Home"
          >
            <Wallet className="h-6 w-6 text-white" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {isRegister ? "Create your Secure Account" : "Welcome Back"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {isRegister
              ? "Start managing your personal cashflow with generative AI"
              : "Access your real-time financial tracking dashboard"}
          </p>
        </div>

        {/* Card Box */}
        <div className="rounded-2xl border border-border/80 bg-card/95 dark:bg-card/75 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all">
          {/* Quick Demo Button / Layman Sandbox */}
          <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Try Instant Guest Demo
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                    1-Click
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">Pre-loaded with sample transactions & AI advisor</p>
              </div>
            </div>
            <Button
              size="sm"
              type="button"
              disabled={submitting}
              onClick={handleDemo}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-8.5 px-3.5 shadow-sm transition-transform active:scale-95 shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Launch 1-Click Instant Guest Demo without signing up"
            >
              {submitting ? "Opening..." : "Explore Demo"}
            </Button>
          </div>

          {/* Form Tabs */}
          <div
            className="flex rounded-xl bg-muted/80 p-1 mb-6 border border-border/50"
            role="tablist"
            aria-label="Authentication Mode"
          >
            <button
              type="button"
              role="tab"
              id="tab-login"
              aria-selected={!isRegister}
              aria-controls="auth-panel"
              onClick={() => toggleTab(false)}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                !isRegister
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              id="tab-register"
              aria-selected={isRegister}
              aria-controls="auth-panel"
              onClick={() => toggleTab(true)}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                isRegister
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Live Screen Reader Announcement Region */}
          <div className="sr-only" role="status" aria-live="polite">
            {isRegister
              ? `Registration form active. ${strengthLabel.ariaText}`
              : "Sign in form active."}
          </div>

          <form
            id="auth-panel"
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
            aria-label={isRegister ? "Registration Form" : "Sign In Form"}
          >
            {/* Full Name (Sign Up only) */}
            {isRegister && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Full Name <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Email Address <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-foreground"
                >
                  Password <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                {isRegister && password && (
                  <span
                    className={`text-[11px] font-bold ${strengthLabel.color.split(" ")[1]}`}
                    aria-live="polite"
                  >
                    {strengthLabel.text}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDetection}
                  onKeyUp={handleKeyDetection}
                  placeholder="••••••••"
                  aria-describedby={isRegister ? "password-requirements" : undefined}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password characters" : "Show password in plain text"}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Caps Lock Alert Banner */}
              {capsLockActive && (
                <div
                  role="alert"
                  className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Caps Lock is ON — check your capitalization</span>
                </div>
              )}

              {/* Password Strength Meter & Interactive Layman Checklist on Registration */}
              {isRegister && password.length > 0 && (
                <div id="password-requirements" className="mt-2.5 space-y-2">
                  {/* Segmented Strength Bar */}
                  <div
                    className="grid grid-cols-4 gap-1.5 h-1.5"
                    role="meter"
                    aria-valuenow={strengthScore}
                    aria-valuemin="0"
                    aria-valuemax="4"
                    aria-label="Password Security Level"
                  >
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-colors ${
                          strengthScore >= step ? strengthLabel.color.split(" ")[0] : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Requirements Checklist with Plain English icons */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                    <span
                      className={`flex items-center gap-1.5 ${
                        strengthCriteria.minLength ? "text-emerald-500 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {strengthCriteria.minLength ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-50" />
                      )}
                      8+ characters
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        strengthCriteria.hasUpper ? "text-emerald-500 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {strengthCriteria.hasUpper ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-50" />
                      )}
                      Uppercase letter (A-Z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        strengthCriteria.hasNumber ? "text-emerald-500 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {strengthCriteria.hasNumber ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-50" />
                      )}
                      One number (0-9)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        strengthCriteria.hasSpecial ? "text-emerald-500 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {strengthCriteria.hasSpecial ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 opacity-50" />
                      )}
                      Symbol (!@#$%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (Registration only) */}
            {isRegister && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Confirm Password <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="auth-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDetection}
                    onKeyUp={handleKeyDetection}
                    placeholder="••••••••"
                    aria-invalid={confirmPassword ? !passwordsMatch : undefined}
                    className={`w-full pl-9 pr-10 py-2.5 rounded-lg border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && !passwordsMatch
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-border focus:ring-emerald-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password characters" : "Show confirm password in plain text"}
                    aria-pressed={showConfirmPassword}
                    className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p role="alert" className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <XCircle className="h-3.5 w-3.5 shrink-0" /> Passwords do not match
                  </p>
                )}
                {confirmPassword && passwordsMatch && (
                  <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Passwords match perfectly
                  </p>
                )}
              </div>
            )}

            {/* Currency & Monthly Income (Registration only) */}
            {isRegister && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="auth-currency" className="block text-xs font-semibold text-foreground mb-1.5">
                    Currency Symbol
                  </label>
                  <select
                    id="auth-currency"
                    name="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="$">$ USD / CAD / AUD</option>
                    <option value="₹">₹ INR (Indian Rupee)</option>
                    <option value="€">€ EUR (Euro)</option>
                    <option value="£">£ GBP (British Pound)</option>
                    <option value="¥">¥ JPY (Japanese Yen)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="auth-income" className="block text-xs font-semibold text-foreground mb-1.5">
                    Monthly Income
                  </label>
                  <input
                    id="auth-income"
                    name="monthlyIncome"
                    type="number"
                    min="0"
                    step="100"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Remember Me Checkbox (Sign In mode) */}
            {!isRegister && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 transition-colors"
                  />
                  <span className="text-xs text-muted-foreground hover:text-foreground">
                    Remember my email
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                  className="text-xs text-emerald-500 hover:text-emerald-400 font-medium inline-flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Help & Security
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || (isRegister && (!passwordsMatch || strengthScore < 3))}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 mt-3 transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Securing Connection...
                </span>
              ) : isRegister ? (
                "Create Protected Account"
              ) : (
                "Sign In Securely"
              )}
            </Button>
          </form>

          {/* Expandable Layman Security & FAQ Drawer */}
          {showSecurityInfo && (
            <div className="mt-4 p-3.5 rounded-xl bg-muted/60 border border-border/80 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  How Your Data is Protected
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecurityInfo(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span><strong>Lockout Defense:</strong> 5 failed attempts locks the account for 15 minutes to defeat automated brute-force attacks.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span><strong>Irreversible Hashing:</strong> Passwords are cryptographically salted and hashed with Bcrypt (cost factor 10).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span><strong>Instant Guest Demo:</strong> Want to test features risk-free? Click "Try Instant Guest Demo" above.</span>
                </li>
              </ul>
            </div>
          )}

          {/* Security Badges Footer */}
          <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> 256-Bit SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-cyan-500 shrink-0" /> Bcrypt Salted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <KeyRound className="h-3 w-3 text-emerald-500 shrink-0" /> Anti-Brute Force
            </span>
          </div>

          {/* Backend Connectivity Status Pill */}
          <div className="mt-3 flex items-center justify-center">
            {backendStatus.checking ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Verifying Cloud Backend...
              </span>
            ) : backendStatus.online ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Backend API Online (Port 8021)
              </span>
            ) : (
              <button
                type="button"
                onClick={checkBackendHealth}
                className="inline-flex items-center gap-1.5 text-[10px] text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                title="Click to re-check backend connection"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Backend Offline (Click to Retry)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
