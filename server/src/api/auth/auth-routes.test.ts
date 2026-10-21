
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";

const { mockCreate, mockHashPassword } = vi.hoisted(
  () => ({
    mockCreate: vi.fn(),
    mockHashPassword: vi.fn(),
  }),
);

vi.mock("../../db/prisma.js", () => ({
  prisma: {
    user: {
      create: mockCreate,
    },
  },
}));

vi.mock("./password.js", () => ({
  hashPassword: mockHashPassword,
  verifyPassword: vi.fn(),
}));

describe("Auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHashPassword.mockResolvedValue("hashed-password");
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
      mockCreate.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(response.status).toBe(500);
    });
  });
});
