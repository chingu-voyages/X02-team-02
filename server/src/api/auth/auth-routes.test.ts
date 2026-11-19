import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";

const {
  mockCreate,
  mockFindUnique,
  mockSessionCreate,
  mockHashPassword,
  mockVerifyPassword,
  mockResetTokenCreate,
  mockResetTokenFindUnique,
  mockResetTokenDeleteMany,
  mockUserUpdateMany,
  mockSessionDeleteMany,
  mockTransaction,
  mockSendPasswordResetEmail,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockSessionCreate: vi.fn(),
  mockHashPassword: vi.fn(),
  mockVerifyPassword: vi.fn(),
  mockResetTokenCreate: vi.fn(),
  mockResetTokenFindUnique: vi.fn(),
  mockResetTokenDeleteMany: vi.fn(),
  mockUserUpdateMany: vi.fn(),
  mockSessionDeleteMany: vi.fn(),
  mockTransaction: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
}));

vi.mock("../../db/prisma.js", () => ({
  prisma: {
    user: {
      create: mockCreate,
      findUnique: mockFindUnique,
    },
    session: {
      create: mockSessionCreate,
    },
    passwordResetToken: {
      create: mockResetTokenCreate,
      findUnique: mockResetTokenFindUnique,
      deleteMany: mockResetTokenDeleteMany,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("./password.js", () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));

vi.mock("../../services/email-service.js", () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

describe("Auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHashPassword.mockResolvedValue("hashed-password");
    mockVerifyPassword.mockResolvedValue(true);

    mockSessionCreate.mockResolvedValue({});
    mockResetTokenCreate.mockResolvedValue({});
    mockResetTokenDeleteMany.mockResolvedValue({ count: 1 });
    mockResetTokenFindUnique.mockResolvedValue(null);
    mockUserUpdateMany.mockResolvedValue({ count: 1 });
    mockSessionDeleteMany.mockResolvedValue({ count: 1 });
    mockSendPasswordResetEmail.mockResolvedValue(undefined);

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          passwordResetToken: {
            create: mockResetTokenCreate,
            deleteMany: mockResetTokenDeleteMany,
          },
          user: {
            updateMany: mockUserUpdateMany,
          },
          session: {
            deleteMany: mockSessionDeleteMany,
          },
        }),
    );
  });

  describe("POST /api/auth/register", () => {
    const validUser = {
      username: "testuser",
      email: "testuser@example.com",
      password: "TestPassword123!",
    };

    it("returns 201 when registration succeeds", async () => {
      mockCreate.mockResolvedValue({
        id: "00000000-0000-0000-0000-000000000001",
        username: validUser.username,
        email: validUser.email,
        createdAt: new Date("2026-10-18T00:00:00.000Z"),
        updatedAt: new Date("2026-10-18T00:00:00.000Z"),
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("passwordHash");
      expect(mockHashPassword).toHaveBeenCalledWith(validUser.password);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: validUser.username,
            email: validUser.email,
            passwordHash: "hashed-password",
          }),
        }),
      );
    });

    it("accepts a password that is exactly 8 characters long", async () => {
      const user = {
        ...validUser,
        password: "12345678",
      };

      mockCreate.mockResolvedValue({
        id: "00000000-0000-0000-0000-000000000001",
        username: user.username,
        email: user.email,
        role: "LEARNER",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send(user);

      expect(response.status).toBe(201);
      expect(mockHashPassword).toHaveBeenCalledWith(user.password);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when the request body is invalid", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "",
          email: "invalid-email",
          password: "",
        });

      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockHashPassword).not.toHaveBeenCalled();
    });

    it("returns field errors when required registration fields are missing", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "",
          email: "",
          password: "",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Validation failed.",
        fieldErrors: [
          {
            field: "username",
            message: "Username is required.",
          },
          {
            field: "email",
            message: "Email is required.",
          },
          {
            field: "password",
            message: "Password is required.",
          },
        ],
      });

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockHashPassword).not.toHaveBeenCalled();
    });

    it("returns all registration field errors in one response", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "u".repeat(51),
          email: "invalid-email",
          password: "short",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Validation failed.",
        fieldErrors: [
          {
            field: "username",
            message: "Username must not exceed 50 characters.",
          },
          {
            field: "email",
            message: "Email must be a valid email address.",
          },
          {
            field: "password",
            message: "Password must be at least 8 characters.",
          },
        ],
      });

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("returns a field error when the password is shorter than 8 characters", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          password: "Short7!",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Validation failed.",
        fieldErrors: [
          {
            field: "password",
            message: "Password must be at least 8 characters.",
          },
        ],
      });

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("returns 409 when the username already exists", async () => {
      mockCreate.mockRejectedValue({
        code: "P2002",
        meta: { target: ["username"] },
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: "An account with this username already exists.",
      });
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("returns 409 when the email already exists", async () => {
      mockCreate.mockRejectedValue({
        code: "P2002",
        meta: { target: ["email"] },
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: "An account with this email already exists.",
      });
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("returns 500 when an unexpected database error occurs", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCreate.mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      try {
        const response = await request(app)
          .post("/api/auth/register")
          .send(validUser);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          error: "Unable to register account.",
        });
      } finally {
        consoleError.mockRestore();
      }
    });
  });

  describe("POST /api/auth/login", () => {
    const credentials = {
      email: "testuser@example.com",
      password: "TestPassword123!",
    };

    const storedUser = {
      id: "00000000-0000-0000-0000-000000000001",
      username: "testuser",
      email: "testuser@example.com",
      role: "LEARNER",
      passwordHash: "stored-password-hash",
      status: "ACTIVE",
    };

    it("returns 200, creates a session, and sets the session cookie", async () => {
      mockFindUnique.mockResolvedValue(storedUser);

      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          id: storedUser.id,
          username: storedUser.username,
          email: storedUser.email,
          role: storedUser.role,
        },
      });

      expect(response.body.user).not.toHaveProperty("passwordHash");

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          passwordHash: true,
          status: true,
        },
      });

      expect(mockVerifyPassword).toHaveBeenCalledWith(
        storedUser.passwordHash,
        credentials.password,
      );

      expect(mockSessionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: storedUser.id,
          id: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });

      const setCookie = response.headers["set-cookie"];

      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toMatch(/^sid=/);
      expect(setCookie[0]).toMatch(/HttpOnly/i);
      expect(setCookie[0]).toMatch(/SameSite=Lax/i);
    });

    it("normalizes the email before looking up the account", async () => {
      mockFindUnique.mockResolvedValue(storedUser);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "  TESTUSER@EXAMPLE.COM  ",
          password: credentials.password,
        });

      expect(response.status).toBe(200);
      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "testuser@example.com" },
        }),
      );
    });

    it("returns the generic 401 response when the email is unknown", async () => {
      mockFindUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Invalid email or password",
      });

      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockSessionCreate).not.toHaveBeenCalled();
    });

    it("returns the generic 401 response when the password is incorrect", async () => {
      mockFindUnique.mockResolvedValue(storedUser);
      mockVerifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Invalid email or password",
      });

      expect(mockSessionCreate).not.toHaveBeenCalled();
    });

    it("returns 400 when email or password is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: credentials.email });

      expect(response.status).toBe(400);
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockSessionCreate).not.toHaveBeenCalled();
    });

    it("returns the generic 401 response and does not create a session for blocked users", async () => {
      mockFindUnique.mockResolvedValue({
        ...storedUser,
        status: "BLOCKED",
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Invalid email or password",
      });

      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockSessionCreate).not.toHaveBeenCalled();
      expect(response.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    const email = "testuser@example.com";
    const activeUser = {
      id: "00000000-0000-0000-0000-000000000001",
      email,
      status: "ACTIVE",
    };

    const genericResponse = {
      message:
        "If an account exists for that email, a password reset link will be sent.",
    };

    it("creates a reset token and sends an email for an active account", async () => {
      mockFindUnique.mockResolvedValue(activeUser);

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email });

      expect(response.status).toBe(202);
      expect(response.body).toEqual(genericResponse);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email },
        select: {
          id: true,
          email: true,
          status: true,
        },
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockResetTokenDeleteMany).toHaveBeenCalledWith({
        where: { userId: activeUser.id },
      });

      expect(mockResetTokenCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: activeUser.id,
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        expect.stringMatching(/^http:\/\/localhost:5173\/reset-password\?token=/),
      );
    });

    it("returns the same response when the email does not belong to an account", async () => {
      mockFindUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email });

      expect(response.status).toBe(202);
      expect(response.body).toEqual(genericResponse);

      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("returns 400 when the email address is invalid", async () => {
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/reset-password", () => {
    const token = "valid-reset-token";
    const password = "NewPassword123!";
    const userId = "00000000-0000-0000-0000-000000000001";

    const validResetToken = {
      id: "00000000-0000-0000-0000-000000000002",
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      user: {
        status: "ACTIVE",
      },
    };

    it("resets the password and invalidates existing sessions", async () => {
      mockResetTokenFindUnique.mockResolvedValue(validResetToken);

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token, password });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Your password has been reset. Please log in.",
      });

      expect(mockResetTokenFindUnique).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.any(String),
        },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          user: {
            select: {
              status: true,
            },
          },
        },
      });

      expect(mockHashPassword).toHaveBeenCalledWith(password);

      expect(mockResetTokenDeleteMany).toHaveBeenCalledWith({
        where: {
          id: validResetToken.id,
          tokenHash: expect.any(String),
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      });

      expect(mockUserUpdateMany).toHaveBeenCalledWith({
        where: {
          id: userId,
          status: "ACTIVE",
        },
        data: {
          passwordHash: "hashed-password",
        },
      });

      expect(mockSessionDeleteMany).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(mockResetTokenDeleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it("returns 400 when the reset token is invalid", async () => {
      mockResetTokenFindUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token, password });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "This password reset link is invalid or has expired.",
      });

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("returns 400 when the reset token has expired", async () => {
      mockResetTokenFindUnique.mockResolvedValue({
        ...validResetToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token, password });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "This password reset link is invalid or has expired.",
      });

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("returns 400 when the new password is shorter than 8 characters", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({ token, password: "short" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Password must be at least 8 characters.",
      });

      expect(mockResetTokenFindUnique).not.toHaveBeenCalled();
      expect(mockHashPassword).not.toHaveBeenCalled();
    });
  });
});
