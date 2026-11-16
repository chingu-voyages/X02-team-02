import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCategories, startExam, getExam } from "./exam-handlers.js";

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

const attemptId = "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b";

function createMocks(
  options: {
    body?: unknown;
    params?: Record<string, string>;
    user?: typeof activeUser | typeof blockedUser;
  } = {},
) {
  const req = {
    body: options.body ?? { category: "PSM" },
    params: options.params ?? {},
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
      mockAttemptFindFirst.mockResolvedValue({ id: "attempt-1" });
      const { req, res } = createMocks();

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        attemptId: "attempt-1",
        resumed: true,
      });
      expect(mockAttemptCreate).not.toHaveBeenCalled();
    });

    it("creates an attempt for the chosen category", async () => {
      mockAttemptFindFirst.mockResolvedValue(null);
      mockQuestionFindMany
        .mockResolvedValueOnce([{ id: questionId }])
        .mockResolvedValueOnce([storedQuestion]);
      mockAttemptCreate.mockResolvedValue({ id: "attempt-2" });
      const { req, res } = createMocks();

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        attemptId: "attempt-2",
        resumed: false,
      });
      expect(mockAttemptCreate).toHaveBeenCalledTimes(1);
    });

    it("only picks approved questions of the chosen category", async () => {
      mockAttemptFindFirst.mockResolvedValue(null);
      mockQuestionFindMany
        .mockResolvedValueOnce([{ id: questionId }])
        .mockResolvedValueOnce([storedQuestion]);
      mockAttemptCreate.mockResolvedValue({ id: "attempt-3" });
      const { req, res } = createMocks({ body: { category: "PSM" } });

      await startExam(req, res);

      expect(mockQuestionFindMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            reviewStatus: "APPROVED",
            category: "PSM",
            answerType: { in: ["MULTIPLE_CHOICE", "SHORT_ANSWER"] },
          }),
        }),
      );
    });

    it("uses the requested count when creating an attempt", async () => {
      const ids = [
        "00000000-0000-0000-0000-000000000021",
        "00000000-0000-0000-0000-000000000022",
        "00000000-0000-0000-0000-000000000023",
      ];
      mockAttemptFindFirst.mockResolvedValue(null);
      mockQuestionFindMany
        .mockResolvedValueOnce(ids.map((id) => ({ id })))
        .mockResolvedValueOnce(ids.map((id) => ({ ...storedQuestion, id })));
      mockAttemptCreate.mockResolvedValue({ id: "attempt-4" });
      const { req, res } = createMocks({ body: { category: "PSM", count: 2 } });

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const data = mockAttemptCreate.mock.calls[0][0].data;
      expect(data.questions.create).toHaveLength(2);
    });

    it.each([0, 100, 1.5])("returns 400 for count %s", async (count) => {
      const { req, res } = createMocks({ body: { category: "PSM", count } });

      await startExam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockAttemptCreate).not.toHaveBeenCalled();
    });
  });

  describe("getExam", () => {
    it("returns 401 when the user is not authenticated", async () => {
      const { req, res } = createMocks({
        user: undefined,
        params: { attemptId },
      });

      await getExam(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockAttemptFindFirst).not.toHaveBeenCalled();
    });

    it("returns 403 when the user is blocked", async () => {
      const { req, res } = createMocks({
        user: blockedUser,
        params: { attemptId },
      });

      await getExam(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockAttemptFindFirst).not.toHaveBeenCalled();
    });

    it("returns 404 for an id that is not a uuid", async () => {
      const { req, res } = createMocks({ params: { attemptId: "abc" } });

      await getExam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockAttemptFindFirst).not.toHaveBeenCalled();
    });

    it("returns 404 when the attempt does not exist or belongs to someone else", async () => {
      mockAttemptFindFirst.mockResolvedValue(null);
      const { req, res } = createMocks({ params: { attemptId } });

      await getExam(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      // The owner check is part of the query itself.
      expect(mockAttemptFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: attemptId, userId: activeUser.id },
        }),
      );
    });

    it("returns the attempt without the answer key", async () => {
      mockAttemptFindFirst.mockResolvedValue({
        id: attemptId,
        category: "PSM",
        questions: [{ ...storedQuestion, id: "row-1", position: 1 }],
      });
      const { req, res } = createMocks({ params: { attemptId } });

      await getExam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const sent = vi.mocked(res.json).mock.calls[0][0];
      expect(sent).toMatchObject({ attemptId, category: "PSM" });
      expect(sent.questions).toHaveLength(1);
      expect(sent.questions[0].position).toBe(1);

      const text = JSON.stringify(sent);
      expect(text).not.toContain("answerKey");
      expect(text).not.toContain("correctOptionIds");
    });

    it("returns 500 when the database query fails", async () => {
      mockAttemptFindFirst.mockRejectedValue(new Error("DB down"));
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { req, res } = createMocks({ params: { attemptId } });

      await getExam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      consoleError.mockRestore();
    });
  });
});
