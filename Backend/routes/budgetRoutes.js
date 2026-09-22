import express from "express";
import {
  getBudgets,
  setBudget,
  deleteBudget,
} from "../controllers/budgetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getBudgets);
router.post("/", setBudget);
router.delete("/:id", deleteBudget);

export default router;
