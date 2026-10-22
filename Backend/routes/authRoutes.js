import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter, loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

export default router;
