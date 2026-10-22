import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Dummy hash for constant-time comparison to mitigate user enumeration timing attacks
const DUMMY_HASH = "$2a$10$eO1vR.0aMsmq8w1mZzO5U.x2y7pL4w5gWfEaV8j4i0WqS1zO5O9O";

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "buildwealth_ai_fallback_jwt_secret",
    { expiresIn: "30d" }
  );
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  // Allow demo credentials to pass smoothly
  if (password.startsWith("demo")) return true;

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

    const user = await User.create({
      name,
      email,
      password,
      currency: typeof currency === "string" && ["$", "₹", "€", "£", "¥"].includes(currency) ? currency : "$",
      monthlyIncome: Number(monthlyIncome) && Number(monthlyIncome) > 0 ? Number(monthlyIncome) : 0,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      token: generateToken(user._id),
      lastLoginAt: user.lastLoginAt,
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
        message: attemptsLeft <= 2
          ? `Invalid email or password. ⚠️ Warning: ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before a 15-minute security lock.`
          : "Invalid email or password. Please try again.",
        attemptsRemaining: attemptsLeft,
      });
    }

    // Login successful: reset failed attempt counter and record audit info
    await user.resetLoginAttempts(req.ip);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      savingsTarget: user.savingsTarget,
      lastLoginAt: user.lastLoginAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to authenticate" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -failedLoginAttempts -lockUntil");
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
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      currency: updatedUser.currency,
      monthlyIncome: updatedUser.monthlyIncome,
      savingsTarget: updatedUser.savingsTarget,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};
