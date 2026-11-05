import express from "express";
import {
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
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter, loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Registration & Authentication
router.post("/register", authLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/refresh", refreshTokenHandler);
router.post("/logout", logoutUser);
router.post("/logout-all", protect, logoutAllSessions);

// Email Verification
router.get("/verify-email/:token", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerificationEmail);

// Password Reset Flow
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

// User Profile Management
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

export default router;
