import express from "express";
import {
  getGoals,
  addGoal,
  depositToGoal,
  deleteGoal,
} from "../controllers/goalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getGoals);
router.post("/", addGoal);
router.post("/:id/deposit", depositToGoal);
router.delete("/:id", deleteGoal);

export default router;
