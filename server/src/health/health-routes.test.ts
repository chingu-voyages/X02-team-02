
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../app.js";

const { mockQueryRaw } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
}));

vi.mock("../db/prisma.js", () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
  },
}));

describe("Health routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("returns 200 when the server is healthy", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "ok",
      });
      expect(mockQueryRaw).not.toHaveBeenCalled();
    });
  });

  describe("GET /health/db", () => {
    it("returns 200 when the database connection succeeds", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

      const response = await request(app).get("/health/db");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "ok",
        database: "connected",
      });
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    });

    it("returns 503 when the database query fails", async () => {
      mockQueryRaw.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app).get("/health/db");

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        status: "error",
        database: "disconnected",
      });
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
