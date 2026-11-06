import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";

const {
  mockSessionFindUnique,
  mockSessionDeleteMany,
} = vi.hoisted(() => ({
  mockSessionFindUnique: vi.fn(),
  mockSessionDeleteMany: vi.fn(),
}));

vi.mock("../../db/prisma.js", () => ({
  prisma: {
    session: {
      findUnique: mockSessionFindUnique,
      deleteMany: mockSessionDeleteMany,
    },
  },
}));

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  username: "testuser",
  email: "testuser@example.com",
  role: "LEARNER",
  status: "ACTIVE",
};

describe("Auth session routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionFindUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });

    mockSessionDeleteMany.mockResolvedValue({
      count: 1,
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 204, deletes the session, and clears the cookie", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", "sid=test-session");

      expect(response.status).toBe(204);

      expect(mockSessionDeleteMany).toHaveBeenCalledWith({
        where: { id: "test-session" },
      });

      const setCookie = response.headers["set-cookie"];

      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toMatch(/^sid=;/);
      expect(setCookie[0]).toMatch(/HttpOnly/i);
      expect(setCookie[0]).toMatch(/SameSite=Lax/i);
    });

    it("returns 204 when there is no session cookie", async () => {
      const response = await request(app)
        .post("/api/auth/logout");

      expect(response.status).toBe(204);
      expect(mockSessionDeleteMany).not.toHaveBeenCalled();

      const setCookie = response.headers["set-cookie"];

      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toMatch(/^sid=;/);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the authenticated user's public information", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", "sid=test-session");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });

      expect(response.body.user).not.toHaveProperty("passwordHash");
      expect(response.body.user).not.toHaveProperty("status");

      expect(mockSessionFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "test-session" },
        }),
      );
    });

    it("returns 401 when there is no session", async () => {
      const response = await request(app)
        .get("/api/auth/me");

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        error: "Authentication required.",
      });

      expect(mockSessionFindUnique).not.toHaveBeenCalled();
    });

    it("returns 401 when the session is unknown", async () => {
      mockSessionFindUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", "sid=unknown-session");

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        error: "Authentication required.",
      });
    });
  });
});
