import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";

const {
  mockCreate,
  mockFindUnique,
  mockSessionCreate,
  mockHashPassword,
  mockVerifyPassword,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockSessionCreate: vi.fn(),
  mockHashPassword: vi.fn(),
  mockVerifyPassword: vi.fn(),
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
  },
}));

vi.mock("./password.js", () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));

describe("Auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHashPassword.mockResolvedValue("hashed-password");
    mockVerifyPassword.mockResolvedValue(true);

    mockSessionCreate.mockResolvedValue({});
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
});
