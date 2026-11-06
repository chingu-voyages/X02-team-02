import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachUser, requireAuth } from "./session-middleware.js";

const { mockGetSessionUser } = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
}));

vi.mock("./session.js", () => ({
  getSessionUser: mockGetSessionUser,
}));

// A tiny app that exercises the middleware without any real routes.
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

  return app;
}

const user = {
  id: "user-1",
  username: "ada",
  email: "ada@example.com",
  role: "LEARNER",
  status: "ACTIVE",
};

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
      mockGetSessionUser.mockResolvedValue(user);

      const response = await request(buildApp())
        .get("/whoami")
        .set("Cookie", "sid=abc");

      expect(mockGetSessionUser).toHaveBeenCalledWith("abc");
      expect(response.body).toEqual({ user });
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
      mockGetSessionUser.mockRejectedValue(new Error("database down"));

      const response = await request(buildApp())
        .get("/whoami")
        .set("Cookie", "sid=abc");

      expect(response.status).toBe(500);
    });
  });

  describe("requireAuth", () => {
    it("answers 401 with an error when nobody is logged in", async () => {
      const response = await request(buildApp()).get("/private");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Authentication required." });
    });

    it("lets a logged-in request through", async () => {
      mockGetSessionUser.mockResolvedValue(user);

      const response = await request(buildApp())
        .get("/private")
        .set("Cookie", "sid=abc");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });
  });
});
