import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCategories, startExam } from "./exam-handlers.js";

const { mockQuestionFindMany, mockAttemptFindFirst, mockAttemptCreate } =
  vi.hoisted(() => ({
    mockQuestionFindMany: vi.fn(),
    mockAttemptFindFirst: vi.fn(),
    mockAttemptCreate: vi.fn(),
  }));

vi.mock("../../db/prisma.js", () => ({
  prisma: {
    question: { findMany: mockQuestionFindMany },
    attempt: { findFirst: mockAttemptFindFirst, create: mockAttemptCreate },
  },
}));

const activeUser = {
  id: "00000000-0000-0000-0000-000000000001",
  status: "ACTIVE" as const,
};
const blockedUser = {
  id: "00000000-0000-0000-0000-000000000002",
  status: "BLOCKED" as const,
};

const questionId = "00000000-0000-0000-0000-000000000003";
const storedQuestion = {
  id: questionId,
  answerType: "MULTIPLE_CHOICE",
  category: "PSM",
  content: {
    text: "Test question?",
    options: [
      { id: "a", text: "Yes" },
      { id: "b", text: "No" },
    ],
  },
  answerKey: { correctOptionIds: ["a"] },
};

function createMocks(
  options: {
    body?: unknown;
    user?: typeof activeUser | typeof blockedUser;
  } = {},
) {
  const req = {
    body: options.body ?? { category: "PSM" },
    user: "user" in options ? options.user : activeUser,
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

describe("Exam handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getCategories", () => {
    it("returns the distinct categories", async () => {
      mockQuestionFindMany.mockResolvedValue([
        { category: "PSM" },
        { category: "PSPO" },
      ]);
      const { req, res } = createMocks();

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ categories: ["PSM", "PSPO"] });
    });

    it("returns 500 when the database query fails", async () => {
      mockQuestionFindMany.mockRejectedValue(new Error("DB down"));
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { req, res } = createMocks();

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      consoleError.mockRestore();
    });
  });

  describe("startExam", () => {
    it("returns 401 when the user is not authenticated", async () => {
      const { req, res } = createMocks({ user: undefined });

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockAttemptCreate).not.toHaveBeenCalled();
    });

    it("returns 403 when the user is blocked", async () => {
      const { req, res } = createMocks({ user: blockedUser });

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockAttemptCreate).not.toHaveBeenCalled();
    });

    it("returns 400 for an empty category", async () => {
      const { req, res } = createMocks({ body: { category: "  " } });

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockQuestionFindMany).not.toHaveBeenCalled();
      expect(mockAttemptCreate).not.toHaveBeenCalled();
    });

    it("returns 404 when the category has no approved questions", async () => {
      mockAttemptFindFirst.mockResolvedValue(null);
      mockQuestionFindMany.mockResolvedValue([]);
      const { req, res } = createMocks();

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockAttemptCreate).not.toHaveBeenCalled();
    });

    it("returns the existing unfinished attempt instead of creating one", async () => {
      mockAttemptFindFirst.mockResolvedValue({
        id: "attempt-1",
        questions: [{ ...storedQuestion, id: "row-1", position: 1 }],
      });
      const { req, res } = createMocks();

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ attemptId: "attempt-1", resumed: true }),
      );
      expect(mockAttemptCreate).not.toHaveBeenCalled();
    });

    it("creates an attempt and never sends the answer key", async () => {
      mockAttemptFindFirst.mockResolvedValue(null);
      mockQuestionFindMany
        .mockResolvedValueOnce([{ id: questionId }]) // ids of candidates
        .mockResolvedValueOnce([storedQuestion]); // full rows
      mockAttemptCreate.mockResolvedValue({
        id: "attempt-2",
        questions: [{ ...storedQuestion, id: "row-1", position: 1 }],
      });
      const { req, res } = createMocks();

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockAttemptCreate).toHaveBeenCalledTimes(1);

      const sent = JSON.stringify(vi.mocked(res.json).mock.calls[0][0]);
      expect(sent).toContain("attempt-2");
      expect(sent).not.toContain("answerKey");
      expect(sent).not.toContain("correctOptionIds");
    });
  });
});
