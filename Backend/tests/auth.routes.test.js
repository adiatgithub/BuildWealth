import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import config from "../config/env.js";
import {
  registerUser,
  loginUser,
  refreshTokenHandler,
  logoutUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    clearedCookies: [],
    status: vi.fn(function (code) {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn(function (data) {
      res.body = data;
      return res;
    }),
    cookie: vi.fn(function (name, val, options) {
      res.cookies[name] = { val, options };
      return res;
    }),
    clearCookie: vi.fn(function (name, options) {
      res.clearedCookies.push({ name, options });
      return res;
    }),
  };
  return res;
};

describe("Auth Controller Unit & Pipeline Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerUser", () => {
    it("should reject passwords that use the demo prefix without meeting strong requirements", async () => {
      const req = {
        body: {
          name: "Test User",
          email: "demo_test@example.com",
          password: "demo123456",
        },
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/Password must be at least 8 characters/);
    });

    it("should register successfully with strong password, set HttpOnly cookies, and return unverified state", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(null);

      const fakeUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Alice Doe",
        email: "alice@example.com",
        currency: "$",
        monthlyIncome: 5000,
        isVerified: false,
        createEmailVerificationToken: vi.fn().mockReturnValue("mock_raw_verification_token"),
        createRefreshSession: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User.prototype, "save").mockImplementation(function () {
        this._id = fakeUser._id;
        this.createEmailVerificationToken = fakeUser.createEmailVerificationToken;
        this.createRefreshSession = fakeUser.createRefreshSession;
        return Promise.resolve(this);
      });

      const req = {
        body: {
          name: "Alice Doe",
          email: "alice@example.com",
          password: "StrongPassword#2026",
          currency: "$",
          monthlyIncome: 5000,
        },
        ip: "127.0.0.1",
        headers: { "user-agent": "VitestAgent" },
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.email).toBe("alice@example.com");
      expect(res.body.isVerified).toBe(false);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      // Check HttpOnly cookies were set
      expect(res.cookies.refreshToken.options.httpOnly).toBe(true);
      expect(res.cookies.accessToken.options.httpOnly).toBe(true);
    });
  });

  describe("loginUser", () => {
    it("should return 423 if account is locked", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "locked@example.com",
        lockUntil: new Date(Date.now() + 12 * 60 * 1000),
        isLocked: () => true,
      };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const req = {
        body: {
          email: "locked@example.com",
          password: "AnyPassword#2026",
        },
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.body.locked).toBe(true);
      expect(res.body.message).toMatch(/Account is temporarily locked/);
      expect(res.body.remainingMinutes).toBeGreaterThan(0);
    });

    it("should return 401 and increment attempts on wrong password", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "user@example.com",
        failedLoginAttempts: 2,
        isLocked: () => false,
        comparePassword: vi.fn().mockResolvedValue(false),
        incrementLoginAttempts: vi.fn().mockImplementation(function () {
          this.failedLoginAttempts = 3;
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const req = {
        body: {
          email: "user@example.com",
          password: "WrongPassword#2026",
        },
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockUser.comparePassword).toHaveBeenCalled();
      expect(mockUser.incrementLoginAttempts).toHaveBeenCalled();
      expect(res.body.attemptsRemaining).toBe(2);
    });

    it("should authenticate successfully, reset attempts, issue short-lived access token and set cookies", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Bob Smith",
        email: "bob@example.com",
        currency: "$",
        monthlyIncome: 6000,
        savingsTarget: 10000,
        isVerified: true,
        lastLoginAt: new Date(),
        isLocked: () => false,
        comparePassword: vi.fn().mockResolvedValue(true),
        resetLoginAttempts: vi.fn().mockResolvedValue(true),
        createRefreshSession: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const req = {
        body: {
          email: "bob@example.com",
          password: "CorrectPassword#2026",
        },
        ip: "127.0.0.1",
        headers: { "user-agent": "VitestAgent" },
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe("bob@example.com");
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.token).toBe(res.body.accessToken);
      expect(mockUser.resetLoginAttempts).toHaveBeenCalled();
      expect(mockUser.createRefreshSession).toHaveBeenCalled();

      // Verify cookies
      expect(res.cookies.refreshToken.options.httpOnly).toBe(true);
      expect(res.cookies.accessToken.options.httpOnly).toBe(true);
    });
  });

  describe("refreshTokenHandler", () => {
    it("should reject request with no refresh token", async () => {
      const req = { cookies: {}, body: {} };
      const res = createMockRes();

      await refreshTokenHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.code).toBe("NO_REFRESH_TOKEN");
    });

    it("should rotate refresh session and return new access token", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const validRefreshToken = jwt.sign(
        { id: userId, nonce: "test_nonce" },
        config.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      const mockUser = {
        _id: userId,
        name: "Test User",
        email: "test@example.com",
        isVerified: true,
        isLocked: () => false,
        findRefreshSession: vi.fn().mockReturnValue({ tokenHash: "hash123", expiresAt: new Date(Date.now() + 10000) }),
        revokeRefreshSession: vi.fn().mockResolvedValue(true),
        createRefreshSession: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findById").mockResolvedValue(mockUser);

      const req = {
        cookies: { refreshToken: validRefreshToken },
        body: {},
        ip: "127.0.0.1",
        headers: { "user-agent": "VitestAgent" },
      };
      const res = createMockRes();

      await refreshTokenHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(mockUser.revokeRefreshSession).toHaveBeenCalledWith(validRefreshToken);
      expect(mockUser.createRefreshSession).toHaveBeenCalled();
    });
  });

  describe("logoutUser", () => {
    it("should revoke session and clear auth cookies", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const validRefreshToken = jwt.sign(
        { id: userId, nonce: "test_nonce" },
        config.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      const mockUser = {
        _id: userId,
        revokeRefreshSession: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findById").mockResolvedValue(mockUser);

      const req = {
        cookies: { refreshToken: validRefreshToken },
        body: {},
      };
      const res = createMockRes();

      await logoutUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/signed out safely/);
      expect(mockUser.revokeRefreshSession).toHaveBeenCalledWith(validRefreshToken);
      expect(res.clearedCookies.some((c) => c.name === "refreshToken")).toBe(true);
      expect(res.clearedCookies.some((c) => c.name === "accessToken")).toBe(true);
    });
  });

  describe("Password Reset & Email Verification Flows", () => {
    it("forgotPassword sends reset instructions generically", async () => {
      const mockUser = {
        name: "Test",
        email: "test@example.com",
        createPasswordResetToken: vi.fn().mockReturnValue("raw_reset_token"),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const req = {
        body: { email: "test@example.com" },
      };
      const res = createMockRes();

      await forgotPassword(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/If an account with that email exists/);
      expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
    });

    it("resetPassword resets password and invalidates all refresh sessions", async () => {
      const rawToken = "sample_reset_token";
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      const mockUser = {
        password: "oldPassword#1",
        refreshSessions: [{ tokenHash: "old_session" }],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findOne").mockImplementation((query) => {
        if (query.resetPasswordToken === hashedToken) {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      });

      const req = {
        body: {
          token: rawToken,
          password: "BrandNewPassword#2026",
        },
      };
      const res = createMockRes();

      await resetPassword(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockUser.password).toBe("BrandNewPassword#2026");
      expect(mockUser.refreshSessions).toEqual([]);
      expect(mockUser.resetPasswordToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("verifyEmail activates user account", async () => {
      const rawToken = "sample_verify_token";
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      const mockUser = {
        isVerified: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findOne").mockImplementation((query) => {
        if (query.verificationToken === hashedToken) {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      });

      const req = {
        body: { token: rawToken },
      };
      const res = createMockRes();

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.verificationToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
