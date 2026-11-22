import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachUser,
  requireAuth,
  requireRole,
} from "./session-middleware.js";

const { mockGetSessionUser } = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
}));

vi.mock("./session.js", () => ({
  getSessionUser: mockGetSessionUser,
}));

const users = {
  LEARNER: {
    id: "user-learner",
    username: "learner",
    email: "learner@example.com",
    role: "LEARNER",
    status: "ACTIVE",
  },
  QUESTION_MANAGER: {
    id: "user-manager",
    username: "manager",
    email: "manager@example.com",
    role: "QUESTION_MANAGER",
    status: "ACTIVE",
  },
  ADMIN: {
    id: "user-admin",
    username: "admin",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
  },
} as const;

// A tiny app that exercises the middleware without real API handlers.
function buildApp() {
  const app = express();

  app.use(cookieParser());
  app.use(attachUser);

  app.get("/whoami", (req, res) => {
    res.json({ user: req.user ?? null });
  });

  app.get("/private", requireAuth, (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/admin", requireRole("ADMIN"), (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/default-deny", requireRole(), (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

describe("Session middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("attachUser", () => {
    it("attaches nobody when there is no cookie", async () => {
      const response = await request(buildApp()).get("/whoami");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: null });
      expect(mockGetSessionUser).not.toHaveBeenCalled();
    });

    it("attaches the user when the cookie holds a valid session", async () => {
      mockGetSessionUser.mockResolvedValue(users.LEARNER);

      const response = await request(buildApp())
        .get("/whoami")
        .set("Cookie", "sid=abc");

      expect(mockGetSessionUser).toHaveBeenCalledWith("abc");
      expect(response.body).toEqual({ user: users.LEARNER });
    });

    it("lets the request through as anonymous when the session is unknown or expired", async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const response = await request(buildApp())
        .get("/whoami")
        .set("Cookie", "sid=stale");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: null });
    });

    it("fails the request with a 500 when the database lookup fails", async () => {
      mockGetSessionUser.mockRejectedValue(
        new Error("database down"),
      );

      const response = await request(buildApp())
        .get("/whoami")
        .set("Cookie", "sid=abc");

      expect(response.status).toBe(500);
    });
  });

  describe("requireAuth", () => {
    it("answers 401 when nobody is logged in", async () => {
      const response = await request(buildApp()).get("/private");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Authentication required.",
      });
    });

    it.each([
      ["LEARNER", users.LEARNER],
      ["QUESTION_MANAGER", users.QUESTION_MANAGER],
      ["ADMIN", users.ADMIN],
    ] as const)(
      "allows an authenticated %s to access an authenticated route",
      async (_role, user) => {
        mockGetSessionUser.mockResolvedValue(user);

        const response = await request(buildApp())
          .get("/private")
          .set("Cookie", "sid=valid-session");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ ok: true });
      },
    );

    it("denies protected requests from blocked or invalid sessions", async () => {
      mockGetSessionUser.mockResolvedValue(null);

      const response = await request(buildApp())
        .get("/private")
        .set("Cookie", "sid=blocked-session");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Authentication required.",
      });
    });
  });

  describe("requireRole", () => {
    it("answers 401 when nobody is logged in", async () => {
      const response = await request(buildApp()).get("/admin");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Authentication required.",
      });
    });

    it.each([
      ["LEARNER", users.LEARNER],
      ["QUESTION_MANAGER", users.QUESTION_MANAGER],
    ] as const)(
      "denies %s access to an admin route",
      async (_role, user) => {
        mockGetSessionUser.mockResolvedValue(user);

        const response = await request(buildApp())
          .get("/admin")
          .set("Cookie", "sid=valid-session");

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
          error: "Forbidden.",
        });
      },
    );

    it("allows ADMIN access to an admin route", async () => {
      mockGetSessionUser.mockResolvedValue(users.ADMIN);

      const response = await request(buildApp())
        .get("/admin")
        .set("Cookie", "sid=valid-session");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it.each([
      ["LEARNER", users.LEARNER],
      ["QUESTION_MANAGER", users.QUESTION_MANAGER],
      ["ADMIN", users.ADMIN],
    ] as const)(
      "denies %s when no roles are explicitly allowed",
      async (_role, user) => {
        mockGetSessionUser.mockResolvedValue(user);

        const response = await request(buildApp())
          .get("/default-deny")
          .set("Cookie", "sid=valid-session");

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
          error: "Forbidden.",
        });
      },
    );
  });
});
