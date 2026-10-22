import express from "express";
import {
  parseTransaction,
  chatAdvisor,
  streamChatAdvisor,
  getInsights,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.use(protect);

router.post("/parse-transaction", aiLimiter, parseTransaction);
router.post("/chat", aiLimiter, chatAdvisor);
router.post("/chat-stream", aiLimiter, streamChatAdvisor);
router.get("/insights", getInsights);

export default router;
