import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

describe("authMiddleware Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should block requests with no token and return NO_TOKEN", async () => {
    const req = { headers: {}, cookies: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "NO_TOKEN" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should authenticate valid Bearer token in Authorization header", async () => {
    const fakeUserId = "507f1f77bcf86cd799439011";
    const token = jwt.sign(
      { id: fakeUserId, email: "test@example.com" },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const mockUser = {
      _id: fakeUserId,
      email: "test@example.com",
      isLocked: () => false,
      changedPasswordAfter: () => false,
    };

    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };
    const res = {};
    const next = vi.fn();

    await protect(req, res, next);

    expect(req.user).toBe(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("should authenticate valid accessToken from HttpOnly cookie", async () => {
    const fakeUserId = "507f1f77bcf86cd799439011";
    const token = jwt.sign(
      { id: fakeUserId, email: "cookie@example.com" },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const mockUser = {
      _id: fakeUserId,
      email: "cookie@example.com",
      isLocked: () => false,
      changedPasswordAfter: () => false,
    };

    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    const req = {
      headers: {},
      cookies: { accessToken: token },
    };
    const res = {};
    const next = vi.fn();

    await protect(req, res, next);

    expect(req.user).toBe(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("should reject expired token with TOKEN_EXPIRED code", async () => {
    const token = jwt.sign(
      { id: "123", email: "test@example.com" },
      config.JWT_SECRET,
      { expiresIn: "0s" } // immediately expired
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TOKEN_EXPIRED" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject token if password was changed after token issuance", async () => {
    // Token issued with iat in the past
    const token = jwt.sign(
      { id: "123", email: "test@example.com" },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const mockUser = {
      _id: "123",
      email: "test@example.com",
      isLocked: () => false,
      changedPasswordAfter: () => true, // Password was changed after token
    };

    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "PASSWORD_CHANGED" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should block request if user account is currently locked", async () => {
    const token = jwt.sign(
      { id: "123", email: "locked@example.com" },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const mockUser = {
      _id: "123",
      email: "locked@example.com",
      lockUntil: new Date(Date.now() + 10 * 60 * 1000),
      isLocked: () => true,
      changedPasswordAfter: () => false,
    };

    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(423);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "ACCOUNT_LOCKED", locked: true })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

