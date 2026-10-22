import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "./app.js";

const { mockGetSessionUser } = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
}));

vi.mock("./api/auth/session.js", () => ({
  getSessionUser: mockGetSessionUser,
}));

vi.mock("./db/prisma.js", () => ({
  prisma: {},
}));

describe("App wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not look up sessions for /health, even with a session cookie", async () => {
    const response = await request(app)
      .get("/health")
      .set("Cookie", "sid=abc");

    expect(response.status).toBe(200);
    expect(mockGetSessionUser).not.toHaveBeenCalled();
  });

  it("looks up the session for requests under /api", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    // An empty body is rejected by the register handler before it reaches the database.
    const response = await request(app)
      .post("/api/auth/register")
      .set("Cookie", "sid=abc")
      .send({});

    expect(mockGetSessionUser).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(400);
  });
});
