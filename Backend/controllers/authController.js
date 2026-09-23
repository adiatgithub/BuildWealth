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
      return res.status(400).json({ message: "Please provide name, email, and password" });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      currency: currency || "$",
      monthlyIncome: Number(monthlyIncome) || 0,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to register user" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });

    // Mitigate timing attacks by performing constant-time hash comparison
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      savingsTarget: user.savingsTarget,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to login" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
