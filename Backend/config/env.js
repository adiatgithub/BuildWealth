import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve path to Backend/.env regardless of process current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Validates critical environment variables.
 * Fails fast and terminates startup if production secrets or required keys are missing.
 */
export const validateEnv = (forceStrict = false) => {
  const isStrict = forceStrict || (process.env.NODE_ENV === "production");
  const errors = [];

  // JWT Secret validation
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push("JWT_SECRET is required. Please set it in your environment or .env file.");
  } else if (isStrict && jwtSecret.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long in production.");
  } else if (isStrict && (jwtSecret.includes("fallback") || jwtSecret.includes("default") || jwtSecret === "secret")) {
    errors.push("JWT_SECRET cannot use an insecure or placeholder secret in production.");
  }

  // JWT Refresh Secret validation
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (isStrict) {
    if (!jwtRefreshSecret) {
      errors.push("JWT_REFRESH_SECRET is required in production for revocable refresh sessions.");
    } else if (jwtRefreshSecret.length < 32) {
      errors.push("JWT_REFRESH_SECRET must be at least 32 characters long in production.");
    } else if (jwtSecret && jwtRefreshSecret === jwtSecret) {
      errors.push("JWT_REFRESH_SECRET should not be identical to JWT_SECRET in production.");
    }
  }

  // MongoDB URI validation
  if (!process.env.MONGODB_URI && process.env.NODE_ENV !== "test") {
    errors.push("MONGODB_URI is required to establish database connectivity.");
  }

  if (errors.length > 0) {
    const errorMsg = `Environment validation failed: ${errors.join("; ")}`;
    if (process.env.NODE_ENV !== "test") {
      console.error("==================================================================");
      console.error("❌ CRITICAL CONFIGURATION FAILURE: Application cannot start safely.");
      errors.forEach((err) => console.error(`  - ${err}`));
      console.error("==================================================================");
      process.exit(1);
    } else {
      throw new Error(errorMsg);
    }
  }
};

export const config = {
  get NODE_ENV() {
    return process.env.NODE_ENV || "development";
  },
  get isProduction() {
    return (process.env.NODE_ENV || "development") === "production";
  },
  get PORT() {
    return parseInt(process.env.PORT, 10) || 8021;
  },
  get MONGODB_URI() {
    return process.env.MONGODB_URI || "";
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET;
  },
  get JWT_REFRESH_SECRET() {
    return process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh_key` : undefined);
  },
  get JWT_ACCESS_EXPIRES_IN() {
    return process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  },
  get JWT_REFRESH_EXPIRES_IN() {
    return process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  },
  get ACCESS_COOKIE_MAX_AGE_MS() {
    return 15 * 60 * 1000; // 15 minutes
  },
  get REFRESH_COOKIE_MAX_AGE_MS() {
    return 7 * 24 * 60 * 60 * 1000; // 7 days
  },
  get FRONTEND_URL() {
    return (process.env.FRONTEND_URL || "http://localhost:5173").trim().replace(/\/+$/, "");
  },
  get GEMINI_API_KEY() {
    return process.env.GEMINI_API_KEY || "";
  },
  get EMAIL_FROM() {
    return process.env.EMAIL_FROM || "BuildWealth.AI <security@buildwealth.ai>";
  },
};

export default config;
