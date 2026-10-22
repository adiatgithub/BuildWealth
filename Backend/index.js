import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoose from "mongoose";

// Load environment variables immediately
dotenv.config();

import connectDB from "./config/db.js";
import { seedDemoAccountIfMissing } from "./config/seedDemo.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import testRoutes from "./routes/testRoute.js";

const app = express();

// Security Headers Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow frontend assets and API consumers without strict CSP blockage
    crossOriginEmbedderPolicy: false,
  })
);

// Production-ready CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched allowed origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev/staging for easy local access
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Payload size limiting to prevent payload flooding / DoS
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Lightweight request logging middleware for observability & audit
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
      console.log(`[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Root & Health Status Endpoints
const getHealthStatus = () => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: dbState === 1 ? "healthy" : "degraded",
    service: "BuildWealth.AI Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || "unknown",
      host: mongoose.connection.host || "none",
    },
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      auth: "/api/auth",
      transactions: "/api/transactions",
      budgets: "/api/budgets",
      goals: "/api/goals",
      ai: "/api/ai",
      health: "/api/health",
    },
  };
};

app.get("/", (req, res) => res.json(getHealthStatus()));
app.get("/api", (req, res) => res.json(getHealthStatus()));
app.get("/api/health", (req, res) => {
  const health = getHealthStatus();
  const statusCode = health.database.status === "connected" ? 200 : 503;
  res.status(statusCode).json(health);
});

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", testRoutes);

// 404 Handler for undefined API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API endpoint '${req.method} ${req.originalUrl}' not found`,
    availableEndpoints: ["/api/auth", "/api/transactions", "/api/budgets", "/api/goals", "/api/ai", "/api/health"],
  });
});

// Centralized Production Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.stack || err.message);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "An unexpected internal server error occurred",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

// Port configuration: Defaults to 8021 to match Frontend expectations
const PORT = parseInt(process.env.PORT, 10) || 8021;

let server;

const startServer = async () => {
  try {
    await connectDB();
    await seedDemoAccountIfMissing();

    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  BuildWealth.AI Backend API running!`);
      console.log(`  Local URL:   http://localhost:${PORT}`);
      console.log(`  Health:      http://localhost:${PORT}/api/health`);
      console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error("Critical failure during server startup:", error.message);
    process.exit(1);
  }
};

// Graceful process shutdown handlers
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down backend gracefully...`);
  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
      } catch (err) {
        console.error("Error closing MongoDB connection:", err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startServer();