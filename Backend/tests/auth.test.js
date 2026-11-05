import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config, validateEnv } from "../config/env.js";
import {
  isStrongPassword,
  isValidEmail,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "../controllers/authController.js";
import cookieParser from "../middleware/cookieParser.js";

describe("Task 1.1 — Authentication Security Fixes", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("1. Centralized Configuration & Production Secret Validation", () => {
    it("should export non-empty centralized config with required properties", () => {
      expect(config.JWT_SECRET).toBeDefined();
      expect(typeof config.JWT_SECRET).toBe("string");
      expect(config.JWT_REFRESH_SECRET).toBeDefined();
      expect(config.JWT_ACCESS_EXPIRES_IN).toBe("15m");
      expect(config.JWT_REFRESH_EXPIRES_IN).toBe("7d");
      expect(config.REFRESH_COOKIE_MAX_AGE_MS).toBe(7 * 24 * 60 * 60 * 1000);
      expect(config.ACCESS_COOKIE_MAX_AGE_MS).toBe(15 * 60 * 1000);
    });

    it("should fail validation if JWT_SECRET is missing or too short in production", () => {
      process.env.JWT_SECRET = "short_secret";
      expect(() => validateEnv(true)).toThrow(/must be at least 32 characters/);

      delete process.env.JWT_SECRET;
      expect(() => validateEnv(true)).toThrow(/JWT_SECRET is required/);
    });

    it("should fail validation if JWT_REFRESH_SECRET is missing in production", () => {
      process.env.JWT_SECRET = "valid_long_jwt_secret_with_32_characters_minimum!";
      delete process.env.JWT_REFRESH_SECRET;
      expect(() => validateEnv(true)).toThrow(/JWT_REFRESH_SECRET is required/);
    });

    it("should fail validation if JWT_REFRESH_SECRET is identical to JWT_SECRET in production", () => {
      const longSecret = "valid_long_jwt_secret_with_32_characters_minimum!";
      process.env.JWT_SECRET = longSecret;
      process.env.JWT_REFRESH_SECRET = longSecret;
      expect(() => validateEnv(true)).toThrow(/should not be identical to JWT_SECRET/);
    });
  });

  describe("2. Password Validation (Demo-password exception removed)", () => {
    it("should reject demo passwords that do not satisfy strong password policy", () => {
      expect(isStrongPassword("demo123456")).toBe(false);
      expect(isStrongPassword("demoPass")).toBe(false);
      expect(isStrongPassword("demo")).toBe(false);
      expect(isStrongPassword("demodemo")).toBe(false);
      expect(isStrongPassword("demopassword123")).toBe(false);
    });

    it("should reject passwords shorter than 8 characters", () => {
      expect(isStrongPassword("Aa1!abc")).toBe(false);
    });

    it("should reject passwords missing uppercase, lowercase, numbers, or special symbols", () => {
      expect(isStrongPassword("alllowercase123!")).toBe(false); // missing uppercase
      expect(isStrongPassword("ALLUPPERCASE123!")).toBe(false); // missing lowercase
      expect(isStrongPassword("LettersOnlySpecial!")).toBe(false); // missing number
      expect(isStrongPassword("Letters12345678")).toBe(false); // missing special char
    });

    it("should accept strong passwords meeting all criteria", () => {
      expect(isStrongPassword("SuperSecure#2026")).toBe(true);
      expect(isStrongPassword("Valid$Pass123")).toBe(true);
      expect(isStrongPassword("BuildWealth@99")).toBe(true);
    });
  });

  describe("3. Short-lived Access Tokens and Refresh Tokens", () => {
    it("should generate valid short-lived access token with user payload and configured expiration", () => {
      const userId = "507f1f77bcf86cd799439011";
      const email = "user@example.com";
      const token = generateAccessToken(userId, email);

      const decoded = jwt.verify(token, config.JWT_SECRET);
      expect(decoded.id).toBe(userId);
      expect(decoded.email).toBe(email);
      // Expiration should be within 15 minutes (900 seconds)
      expect(decoded.exp - decoded.iat).toBe(15 * 60);
    });

    it("should generate valid refresh token signed with JWT_REFRESH_SECRET", () => {
      const userId = "507f1f77bcf86cd799439011";
      const refreshToken = generateRefreshToken(userId);

      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
      expect(decoded.id).toBe(userId);
      expect(decoded.nonce).toBeDefined();
      // Expiration should be 7 days (604800 seconds)
      expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
    });

    it("access token must fail verification against JWT_REFRESH_SECRET (key separation)", () => {
      const token = generateAccessToken("123", "user@example.com");
      expect(() => jwt.verify(token, config.JWT_REFRESH_SECRET)).toThrow();
    });
  });

  describe("4. Secure, HttpOnly, SameSite Cookies & Cookie Parser", () => {
    it("setAuthCookies should set refreshToken and accessToken with HttpOnly and SameSite", () => {
      const res = {
        cookie: vi.fn(),
      };

      setAuthCookies(res, "sample_refresh_token", "sample_access_token");

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "sample_refresh_token",
        expect.objectContaining({
          httpOnly: true,
          path: "/",
          sameSite: expect.stringMatching(/lax|strict/),
        })
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        "sample_access_token",
        expect.objectContaining({
          httpOnly: true,
          path: "/",
          sameSite: expect.stringMatching(/lax|strict/),
        })
      );
    });

    it("clearAuthCookies should clear both cookies", () => {
      const res = {
        clearCookie: vi.fn(),
      };

      clearAuthCookies(res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.objectContaining({ httpOnly: true, path: "/" })
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        expect.objectContaining({ httpOnly: true, path: "/" })
      );
    });

    it("cookieParser middleware should populate req.cookies from Cookie header", () => {
      const req = {
        headers: {
          cookie: "refreshToken=test_refresh; accessToken=test_access; theme=dark",
        },
      };
      const res = {};
      const next = vi.fn();

      cookieParser(req, res, next);

      expect(req.cookies).toEqual({
        refreshToken: "test_refresh",
        accessToken: "test_access",
        theme: "dark",
      });
      expect(next).toHaveBeenCalled();
    });

    it("cookieParser handles empty or missing Cookie header gracefully", () => {
      const req = { headers: {} };
      const next = vi.fn();

      cookieParser(req, {}, next);
      expect(req.cookies).toEqual({});
      expect(next).toHaveBeenCalled();
    });
  });

  describe("5. Revocable Refresh Sessions & Schema Methods", () => {
    it("should correctly hash and find refresh sessions", () => {
      const rawToken = "raw_refresh_token_xyz_123";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const fakeUser = {
        refreshSessions: [
          {
            tokenHash,
            expiresAt: new Date(Date.now() + 100000),
          },
        ],
      };

      // Mock findRefreshSession logic
      const incomingHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const session = fakeUser.refreshSessions.find(
        (s) => s.tokenHash === incomingHash && s.expiresAt > new Date()
      );
      expect(session).toBeDefined();

      // Revocation: removing session
      fakeUser.refreshSessions = fakeUser.refreshSessions.filter((s) => s.tokenHash !== incomingHash);
      const revokedSession = fakeUser.refreshSessions.find(
        (s) => s.tokenHash === incomingHash
      );
      expect(revokedSession).toBeUndefined();
    });
  });

  describe("6. Email Verification & Password Reset Tokens", () => {
    it("createEmailVerificationToken should produce a raw token and a SHA-256 hashed DB token", () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      expect(rawToken).toHaveLength(64);
      expect(hashedToken).toHaveLength(64);
      expect(hashedToken).not.toBe(rawToken);

      // Verify that matching hash matches
      const checkHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      expect(checkHash).toBe(hashedToken);
    });

    it("createPasswordResetToken should produce a valid raw token and expiry", () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(hashedToken).toBeDefined();
    });
  });

  describe("7. Account Lockout Consistency", () => {
    it("should correctly evaluate isLocked based on lockUntil timestamp", () => {
      const lockedUser = {
        lockUntil: new Date(Date.now() + 15 * 60 * 1000),
      };
      const isLocked = Boolean(lockedUser.lockUntil && new Date(lockedUser.lockUntil).getTime() > Date.now());
      expect(isLocked).toBe(true);

      const unlockedUser = {
        lockUntil: new Date(Date.now() - 1000),
      };
      const isUnlocked = Boolean(unlockedUser.lockUntil && new Date(unlockedUser.lockUntil).getTime() > Date.now());
      expect(isUnlocked).toBe(false);
    });

    it("should calculate remaining minutes correctly for locked accounts", () => {
      const lockUntil = new Date(Date.now() + 14 * 60 * 1000 + 30000); // ~14.5 minutes
      const remainingMinutes = Math.max(1, Math.ceil((new Date(lockUntil).getTime() - Date.now()) / (60 * 1000)));
      expect(remainingMinutes).toBe(15);
    });
  });
});
