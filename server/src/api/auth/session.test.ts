import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_TTL_MS,
  createSession,
  deleteSession,
  getSessionUser,
} from "./session.js";

const { mockCreate, mockFindUnique, mockDeleteMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockDeleteMany: vi.fn(),
}));

vi.mock("../../db/prisma.js", () => ({
  prisma: {
    session: {
      create: mockCreate,
      findUnique: mockFindUnique,
      deleteMany: mockDeleteMany,
    },
  },
}));

const NOW = new Date("2026-01-01T00:00:00.000Z");

const user = {
  id: "user-1",
  username: "ada",
  email: "ada@example.com",
  role: "LEARNER",
  status: "ACTIVE",
};

describe("Session helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createSession", () => {
    it("saves the session for the user with an expiry 7 days out", async () => {
      mockCreate.mockResolvedValue({});

      const session = await createSession("user-1");
      const expectedExpiry = new Date(NOW.getTime() + SESSION_TTL_MS);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          id: session.id,
          userId: "user-1",
          expiresAt: expectedExpiry,
        },
      });
      expect(session.expiresAt).toEqual(expectedExpiry);
    });

    it("creates a long, different token each time", async () => {
      mockCreate.mockResolvedValue({});

      const first = await createSession("user-1");
      const second = await createSession("user-1");

      expect(first.id).toHaveLength(43);
      expect(first.id).not.toBe(second.id);
    });
  });

  describe("getSessionUser", () => {
    it("returns null when the session does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      expect(await getSessionUser("missing")).toBeNull();
      expect(mockDeleteMany).not.toHaveBeenCalled();
    });

    it("returns the user when the session is valid", async () => {
      mockFindUnique.mockResolvedValue({
        expiresAt: new Date(NOW.getTime() + 1000),
        user,
      });

      expect(await getSessionUser("valid")).toEqual(user);
      expect(mockDeleteMany).not.toHaveBeenCalled();
    });

    it("returns null and deletes the session when it has expired", async () => {
      mockFindUnique.mockResolvedValue({
        expiresAt: new Date(NOW.getTime() - 1000),
        user,
      });
      mockDeleteMany.mockResolvedValue({ count: 1 });

      expect(await getSessionUser("expired")).toBeNull();
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { id: "expired" },
      });
    });
  });

  describe("deleteSession", () => {
    it("deletes the session by id", async () => {
      mockDeleteMany.mockResolvedValue({ count: 1 });

      await deleteSession("abc");

      expect(mockDeleteMany).toHaveBeenCalledWith({ where: { id: "abc" } });
    });

    it("does not throw when the session is already gone", async () => {
      mockDeleteMany.mockResolvedValue({ count: 0 });

      await expect(deleteSession("gone")).resolves.toBeUndefined();
    });
  });
});
