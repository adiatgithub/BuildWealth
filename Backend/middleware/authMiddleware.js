import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";

/**
 * Middleware to protect private API routes.
 * Authenticates requests via Bearer token in Authorization header
 * or secure HttpOnly accessToken cookie.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. Fall back to secure HttpOnly cookie for browser sessions
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({
      message: "Please sign in to access this feature.",
      code: "NO_TOKEN",
    });
  }

  try {
    // Verify token using strictly centralized JWT_SECRET with no hardcoded fallback
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists. Please sign in again.",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if password was changed after this access token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        message: "Password was recently changed. Please sign in again.",
        code: "PASSWORD_CHANGED",
      });
    }

    // Check if user is locked
    if (user.isLocked && user.isLocked()) {
      const remainingMinutes = Math.max(1, Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000)));
      return res.status(423).json({
        message: `Account is temporarily locked. Please wait ${remainingMinutes} minute(s).`,
        locked: true,
        code: "ACCOUNT_LOCKED",
      });
    }

    req.user = user;
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
};

export default protect;
