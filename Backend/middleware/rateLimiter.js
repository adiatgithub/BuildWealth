import rateLimit from "express-rate-limit";

// Rate limiter for general authentication endpoints (register, profile, me)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    message: "Too many authentication requests from your device. For your security, please wait 15 minutes before trying again.",
  },
});

// Stricter rate limiter specifically for login attempts to thwart credential stuffing and dictionary attacks
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 login attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    message: "Multiple rapid sign-in attempts detected. For your security, please wait 5 minutes or explore the Guest Demo.",
  },
});

// General API rate limiter for conversational AI queries
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    message: "Our AI Advisor is processing many requests. Please wait a moment before asking your next question.",
  },
});

