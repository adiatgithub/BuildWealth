import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import config from "../config/env.js";
import { sendEmail } from "../services/emailService.js";

// Dummy hash for constant-time comparison to mitigate user enumeration timing attacks
const DUMMY_HASH = "$2a$10$eO1vR.0aMsmq8w1mZzO5U.x2y7pL4w5gWfEaV8j4i0WqS1zO5O9O";

/**
 * Generate short-lived access token (default 15m)
 */
export const generateAccessToken = (id, email) => {
  return jwt.sign(
    { id, email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Generate long-lived refresh token (default 7d)
 */
export const generateRefreshToken = (id) => {
  return jwt.sign(
    { id, nonce: crypto.randomBytes(16).toString("hex") },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Configure secure, HttpOnly, SameSite cookies for browser sessions
 */
export const setAuthCookies = (res, refreshToken, accessToken = null) => {
  const isProd = config.isProduction;

  // Refresh token cookie (HttpOnly, SameSite)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: config.REFRESH_COOKIE_MAX_AGE_MS,
    path: "/",
  });

  // Access token cookie for automatic browser session authentication
  if (accessToken) {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      maxAge: config.ACCESS_COOKIE_MAX_AGE_MS,
      path: "/",
    });
  }
};

/**
 * Clear authentication cookies on logout or session invalidation
 */
export const clearAuthCookies = (res) => {
  const isProd = config.isProduction;
  const clearOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
  };

  res.clearCookie("refreshToken", clearOptions);
  res.clearCookie("accessToken", clearOptions);
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && emailRegex.test(email);
};

/**
 * Standard password validation policy.
 * Any demo password exception has been completely removed.
 */
export const isStrongPassword = (password) => {
  if (typeof password !== "string") return false;

  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    let { name, email, password, currency, monthlyIncome } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide your name, email, and a secure password" });
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input format provided" });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    if (name.length < 2 || name.length > 70) {
      return res.status(400).json({ message: "Name must be between 2 and 70 characters" });
    }

    if (email.length > 120 || !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address (e.g. name@example.com)" });
    }

    if (password.length > 128) {
      return res.status(400).json({ message: "Password cannot exceed 128 characters" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special symbol (!@#$%^&*)",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "An account with this email address already exists. Please log in instead." });
    }

    const user = new User({
      name,
      email,
      password,
      currency: typeof currency === "string" && ["$", "₹", "€", "£", "¥"].includes(currency) ? currency : "$",
      monthlyIncome: Number(monthlyIncome) && Number(monthlyIncome) > 0 ? Number(monthlyIncome) : 0,
      isVerified: false,
    });

    // Create verification token
    const rawVerificationToken = user.createEmailVerificationToken();
    await user.save();

    // Create tokens & refresh session
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);
    const refreshExpiry = new Date(Date.now() + config.REFRESH_COOKIE_MAX_AGE_MS);
    await user.createRefreshSession(refreshToken, refreshExpiry, req.ip, req.headers["user-agent"]);

    // Send verification email
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${rawVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify Your BuildWealth.AI Account",
      text: `Hello ${user.name},\n\nPlease verify your email address by opening the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationUrl}">Verify My Account</a></p><p>This link will expire in 24 hours.</p>`,
    });

    // Set secure HttpOnly cookies
    setAuthCookies(res, refreshToken, accessToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      isVerified: user.isVerified,
      token: accessToken, // Backward compatibility for existing Bearer token clients
      accessToken,
      refreshToken,
      lastLoginAt: user.lastLoginAt,
      message: "Registration successful. Please verify your email address.",
      ...(config.NODE_ENV !== "production" ? { devVerificationToken: rawVerificationToken } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to register user account" });
  }
};

// @desc    Authenticate user & get token with account lockout protection
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email address and password" });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid credentials format" });
    }

    if (password.length > 128) {
      return res.status(400).json({ message: "Password length exceeds safety limit" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    // Mitigate timing attacks by performing constant-time hash comparison if user not found
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: "Invalid email or password. Please verify your credentials." });
    }

    // Check if account is temporarily locked
    if (user.isLocked && user.isLocked()) {
      const remainingMinutes = Math.max(1, Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000)));
      return res.status(423).json({
        message: `Account is temporarily locked for your security due to 5 consecutive failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}, or use the Guest Demo.`,
        locked: true,
        remainingMinutes,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Record failed attempt
      await user.incrementLoginAttempts();

      if (user.isLocked()) {
        return res.status(423).json({
          message: "Too many failed login attempts. Your account has been temporarily locked for 15 minutes to protect your financial data.",
          locked: true,
          remainingMinutes: 15,
        });
      }

      const attemptsLeft = Math.max(0, 5 - (user.failedLoginAttempts || 0));
      return res.status(401).json({
        message:
          attemptsLeft <= 2
            ? `Invalid email or password. ⚠️ Warning: ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before a 15-minute security lock.`
            : "Invalid email or password. Please try again.",
        attemptsRemaining: attemptsLeft,
      });
    }

    // Login successful: reset failed attempt counter and record audit info
    await user.resetLoginAttempts(req.ip);

    // Issue short-lived access token and revocable refresh session
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);
    const refreshExpiry = new Date(Date.now() + config.REFRESH_COOKIE_MAX_AGE_MS);
    await user.createRefreshSession(refreshToken, refreshExpiry, req.ip, req.headers["user-agent"]);

    // Set secure HttpOnly cookies for browser sessions
    setAuthCookies(res, refreshToken, accessToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      savingsTarget: user.savingsTarget,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to authenticate" });
  }
};

// @desc    Refresh access token using revocable refresh session
// @route   POST /api/auth/refresh
export const refreshTokenHandler = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({
        message: "No refresh session provided. Please sign in again.",
        code: "NO_REFRESH_TOKEN",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, config.JWT_REFRESH_SECRET);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({
        message: "Refresh session expired or invalid. Please sign in again.",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        message: "User session not found.",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if user is locked
    if (user.isLocked && user.isLocked()) {
      clearAuthCookies(res);
      return res.status(423).json({
        message: "Account is temporarily locked.",
        locked: true,
        code: "ACCOUNT_LOCKED",
      });
    }

    // Check if session exists and is active (revocation detection)
    const activeSession = user.findRefreshSession(rawRefreshToken);
    if (!activeSession) {
      // Possible token reuse or revoked session!
      clearAuthCookies(res);
      return res.status(401).json({
        message: "Session has been revoked or expired. Please sign in again.",
        code: "SESSION_REVOKED",
      });
    }

    // Rotate refresh token: revoke current session and issue new pair
    await user.revokeRefreshSession(rawRefreshToken);

    const newAccessToken = generateAccessToken(user._id, user.email);
    const newRefreshToken = generateRefreshToken(user._id);
    const refreshExpiry = new Date(Date.now() + config.REFRESH_COOKIE_MAX_AGE_MS);
    await user.createRefreshSession(newRefreshToken, refreshExpiry, req.ip, req.headers["user-agent"]);

    // Update secure HttpOnly cookies
    setAuthCookies(res, newRefreshToken, newAccessToken);

    res.json({
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to refresh token" });
  }
};

// @desc    Log out user and revoke current refresh session
// @route   POST /api/auth/logout
export const logoutUser = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawRefreshToken) {
      try {
        const decoded = jwt.verify(rawRefreshToken, config.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          await user.revokeRefreshSession(rawRefreshToken);
        }
      } catch {
        // Token was invalid or expired anyway
      }
    }

    clearAuthCookies(res);
    res.json({ message: "You have signed out safely." });
  } catch (error) {
    clearAuthCookies(res);
    res.status(500).json({ message: error.message || "Logout failed" });
  }
};

// @desc    Revoke all refresh sessions across all devices
// @route   POST /api/auth/logout-all
export const logoutAllSessions = async (req, res) => {
  try {
    if (req.user) {
      await req.user.revokeAllRefreshSessions();
    }
    clearAuthCookies(res);
    res.json({ message: "All sessions have been revoked across all devices." });
  } catch (error) {
    clearAuthCookies(res);
    res.status(500).json({ message: error.message || "Failed to revoke all sessions" });
  }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !isValidEmail(email.trim().toLowerCase())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    let rawResetToken;
    if (user) {
      rawResetToken = user.createPasswordResetToken();
      await user.save();

      const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${rawResetToken}`;
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request — BuildWealth.AI",
        text: `Hello ${user.name},\n\nYou requested a password reset. Please click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 60 minutes.\nIf you did not make this request, please ignore this email.`,
        html: `<p>Hello <strong>${user.name}</strong>,</p><p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 60 minutes.</p><p>If you did not request this, you can safely ignore this email.</p>`,
      });
    }

    // Generic response to prevent email enumeration
    res.json({
      message: "If an account with that email exists, password reset instructions have been sent.",
      ...(config.NODE_ENV !== "production" && rawResetToken ? { devResetToken: rawResetToken } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to process password reset request" });
  }
};

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password or POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const token = req.params?.token || req.body?.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Password reset token is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters long and contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special symbol (!@#$%^&*)",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Revoke all existing sessions so old tokens are discarded
    user.refreshSessions = [];

    await user.save();

    clearAuthCookies(res);

    res.json({
      message: "Password has been successfully reset. Please log in with your new password.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to reset password" });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token or POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const token = req.params?.token || req.body?.token;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Email verification link is invalid or has expired." });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({
      message: "Your email has been successfully verified! You now have full access to BuildWealth.AI.",
      isVerified: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to verify email" });
  }
};

// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    let rawToken;
    if (user && !user.isVerified) {
      rawToken = user.createEmailVerificationToken();
      await user.save();

      const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${rawToken}`;
      await sendEmail({
        to: user.email,
        subject: "Verify Your BuildWealth.AI Account",
        text: `Hello ${user.name},\n\nPlease verify your email by clicking:\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
        html: `<p>Hello <strong>${user.name}</strong>,</p><p><a href="${verificationUrl}">Verify Account</a></p>`,
      });
    }

    res.json({
      message: "If that email is registered and unverified, a new verification link has been sent.",
      ...(config.NODE_ENV !== "production" && rawToken ? { devVerificationToken: rawToken } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to resend verification email" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -failedLoginAttempts -lockUntil -refreshSessions -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires"
    );
    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch profile" });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.currency = req.body.currency || user.currency;
    if (req.body.monthlyIncome !== undefined) {
      user.monthlyIncome = Number(req.body.monthlyIncome);
    }
    if (req.body.savingsTarget !== undefined) {
      user.savingsTarget = Number(req.body.savingsTarget);
    }

    if (req.body.password) {
      if (!isStrongPassword(req.body.password)) {
        return res.status(400).json({
          message:
            "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
      }
      user.password = req.body.password;
      // Revoke all other refresh sessions on password change
      user.refreshSessions = [];
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      currency: updatedUser.currency,
      monthlyIncome: updatedUser.monthlyIncome,
      savingsTarget: updatedUser.savingsTarget,
      isVerified: updatedUser.isVerified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};

export default {
  registerUser,
  loginUser,
  refreshTokenHandler,
  logoutUser,
  logoutAllSessions,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getMe,
  updateProfile,
};
