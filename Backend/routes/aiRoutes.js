import express from "express";
import {
  parseTransaction,
  chatAdvisor,
  getInsights,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/parse-transaction", parseTransaction);
router.post("/chat", chatAdvisor);
router.get("/insights", getInsights);

export default router;
