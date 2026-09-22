import express from "express";
import {
  getTransactions,
  getTransactionStats,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // Protect all transaction routes

router.get("/", getTransactions);
router.get("/stats", getTransactionStats);
router.post("/", addTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
