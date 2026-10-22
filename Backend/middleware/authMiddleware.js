import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      if (!token || token === "null" || token === "undefined") {
        return res.status(401).json({ message: "No security token found. Please log in.", code: "NO_TOKEN" });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "buildwealth_ai_super_secret_jwt_key_2026_finance_tracker"
      );

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User account no longer exists. Please sign in again.", code: "USER_NOT_FOUND" });
      }

      // Check if user is locked
      if (req.user.isLocked && req.user.isLocked()) {
        const remainingMinutes = Math.max(1, Math.ceil((new Date(req.user.lockUntil).getTime() - Date.now()) / (60 * 1000)));
        return res.status(423).json({
          message: `Account is temporarily locked. Please wait ${remainingMinutes} minute(s).`,
          locked: true,
          code: "ACCOUNT_LOCKED",
        });
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Your session has expired. Please log in again to continue.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        message: "Authentication failed. Please sign in again.",
        code: "INVALID_TOKEN",
      });
    }
  } else {
    return res.status(401).json({
      message: "Please sign in to access this feature.",
      code: "NO_TOKEN",
    });
  }
};

