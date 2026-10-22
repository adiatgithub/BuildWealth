import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      minlength: 6,
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

// Hash password before saving
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
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

// Increment failed login attempts and trigger 15-minute lock at 5 failures
userSchema.methods.incrementLoginAttempts = async function () {
  // If a previous lock expired, reset attempts to 1
  if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = null;
    return this.save();
  }

  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

  if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
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

const User = mongoose.model("User", userSchema);
export default User;
