import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    limitAmount: {
      type: Number,
      required: true,
      min: [0, "Budget limit cannot be negative"],
    },
    period: {
      type: String,
      default: "monthly",
      enum: ["weekly", "monthly", "yearly"],
    },
  },
  { timestamps: true }
);

// Ensure unique budget per category per user
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
