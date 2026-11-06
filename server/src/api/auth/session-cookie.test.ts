import type { Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  setSessionCookie,
} from "./session-cookie.js";

function fakeResponse() {
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };
  return { res, response: res as unknown as Response };
}

const session = {
  id: "token-123",
  expiresAt: new Date("2026-01-08T00:00:00.000Z"),
};

describe("Session cookie helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("setSessionCookie", () => {
    it("sets the session id as an HttpOnly, SameSite=Lax cookie", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { res, response } = fakeResponse();

      setSessionCookie(response, session);

      expect(res.cookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, "token-123", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        expires: session.expiresAt,
      });
    });

    it("is not Secure outside production", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { res, response } = fakeResponse();

      setSessionCookie(response, session);

      expect(res.cookie.mock.calls[0][2].secure).toBe(false);
    });

    it("is Secure in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const { res, response } = fakeResponse();

      setSessionCookie(response, session);

      expect(res.cookie.mock.calls[0][2].secure).toBe(true);
    });
  });

  describe("clearSessionCookie", () => {
    it("clears the cookie using the same options it was set with", () => {
      vi.stubEnv("NODE_ENV", "development");
      const { res, response } = fakeResponse();

      clearSessionCookie(response);

      expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });
    });
  });
});
