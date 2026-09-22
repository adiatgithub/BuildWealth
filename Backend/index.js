import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import testRoutes from "./routes/testRoute.js";
import connectDB from "./config/db.js";


import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const statusResponse = (req, res) => {
  res.json({
    status: "online",
    service: "BuildWealth.AI Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      transactions: "/api/transactions",
      budgets: "/api/budgets",
      goals: "/api/goals",
      ai: "/api/ai",
      test: "/api/test",
    },
  });
};

app.get("/", statusResponse);
app.get("/api", statusResponse);

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", testRoutes);

const PORT = process.env.PORT || 8025;

const startServer = () => {
    connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer(); 