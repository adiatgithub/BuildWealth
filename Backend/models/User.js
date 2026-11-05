import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const refreshSessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
    },
    currency: {
      type: String,
      default: "$",
    },
    monthlyIncome: {
      type: Number,
      default: 0,
    },
    savingsTarget: {
      type: Number,
      default: 0,
    },

    // Email verification state
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },

    // Password reset state
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Revocable refresh sessions
    refreshSessions: {
      type: [refreshSessionSchema],
      default: [],
    },

    // Login Security & Brute-Force Defense
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is currently locked due to failed attempts
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && new Date(this.lockUntil).getTime() > Date.now());
};

// Increment failed login attempts and trigger 15-minute lock at 5 failures
userSchema.methods.incrementLoginAttempts = async function () {
  const now = Date.now();
  // If a previous lock expired, reset attempts to 1
  if (this.lockUntil && new Date(this.lockUntil).getTime() <= now) {
    this.failedLoginAttempts = 1;
    this.lockUntil = null;
    return this.save();
  }

  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

  if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(now + LOCK_TIME_MS);
  }

  return this.save();
};

// Reset failed login counter upon successful authentication
userSchema.methods.resetLoginAttempts = async function (ip) {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  if (ip) {
    this.lastLoginIp = String(ip);
  }
  return this.save();
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Generate and store email verification token (hash stored, raw returned)
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return rawToken;
};

// Generate and store password reset token (hash stored, raw returned)
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken;
};

// Create a new revocable refresh session (stores hash of refresh token)
userSchema.methods.createRefreshSession = async function (rawRefreshToken, expiresAt, ip = "", userAgent = "") {
  const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

  // Prune expired sessions
  const now = new Date();
  this.refreshSessions = (this.refreshSessions || []).filter(
    (s) => s.expiresAt && new Date(s.expiresAt) > now
  );

  // Limit concurrent sessions to 10 max
  if (this.refreshSessions.length >= 10) {
    this.refreshSessions.shift();
  }

  this.refreshSessions.push({
    tokenHash,
    expiresAt,
    createdAt: now,
    ip: String(ip || ""),
    userAgent: String(userAgent || "").slice(0, 200),
  });

  return this.save();
};

// Find an active, non-expired refresh session by raw token
userSchema.methods.findRefreshSession = function (rawRefreshToken) {
  if (!rawRefreshToken || !this.refreshSessions) return null;
  const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
  const now = new Date();
  return this.refreshSessions.find(
    (s) => s.tokenHash === tokenHash && s.expiresAt && new Date(s.expiresAt) > now
  );
};

// Revoke a specific refresh session (e.g. on single-device logout or rotation)
userSchema.methods.revokeRefreshSession = async function (rawRefreshToken) {
  if (!rawRefreshToken || !this.refreshSessions) return this;
  const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
  this.refreshSessions = this.refreshSessions.filter((s) => s.tokenHash !== tokenHash);
  return this.save();
};

// Revoke all refresh sessions (e.g. on password change, password reset, or full logout)
userSchema.methods.revokeAllRefreshSessions = async function () {
  this.refreshSessions = [];
  return this.save();
};

const User = mongoose.model("User", userSchema);
export default User;
