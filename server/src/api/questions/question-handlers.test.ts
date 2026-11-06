import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQuestion, loadQuestions } from "./question-handlers.js";

const { mockCreate, mockFindMany, mockCount } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock("../../db/prisma.js", () => ({
  prisma: {
    question: {
      create: mockCreate,
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

const validQuestion = {
  answerType: "SHORT_ANSWER",
  content: {
    text: "What does HTTP stand for?",
  },
  answerKey: {
    acceptedAnswers: ["Hypertext Transfer Protocol"],
  },
  category: "Web Development",
  difficulty: "EASY",
};

const activeUser = {
  id: "00000000-0000-0000-0000-000000000001",
  status: "ACTIVE" as const,
};

const blockedUser = {
  id: "00000000-0000-0000-0000-000000000002",
  status: "BLOCKED" as const,
};

function createMocks(
  options: {
    body?: unknown;
    user?: typeof activeUser | typeof blockedUser;
  } = {},
) {
  const req = {
    body: options.body ?? validQuestion,
    user: "user" in options ? options.user : activeUser,
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

describe("Question handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createQuestion", () => {
    it("returns 401 when the user is not authenticated", async () => {
      const { req, res } = createMocks({ user: undefined });

      await createQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentication required.",
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("returns 403 when the user account is blocked", async () => {
      const { req, res } = createMocks({ user: blockedUser });

      await createQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Blocked users cannot submit questions.",
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("returns 400 when the request body is invalid", async () => {
      const { req, res } = createMocks({
        body: {
          answerType: "SHORT_ANSWER",
          content: {
            text: "",
          },
          answerKey: {
            acceptedAnswers: [],
          },
          category: "",
        },
      });

      await createQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed.",
          fieldErrors: expect.any(Array),
        }),
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("creates a question with PENDING status when submission succeeds", async () => {
      const createdQuestion = {
        id: "00000000-0000-0000-0000-000000000003",
        createdAt: new Date("2026-10-31T00:00:00.000Z"),
        updatedAt: new Date("2026-10-31T00:00:00.000Z"),
        answerType: "SHORT_ANSWER",
        content: validQuestion.content,
        category: validQuestion.category,
        difficulty: validQuestion.difficulty,
        reviewStatus: "PENDING",
        authorId: activeUser.id,
      };

      mockCreate.mockResolvedValue(createdQuestion);

      const { req, res } = createMocks();

      await createQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Question submitted for review.",
        question: createdQuestion,
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          answerType: validQuestion.answerType,
          content: validQuestion.content,
          answerKey: validQuestion.answerKey,
          category: validQuestion.category,
          difficulty: validQuestion.difficulty,
          reviewStatus: "PENDING",
          authorId: activeUser.id,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          answerType: true,
          content: true,
          category: true,
          difficulty: true,
          reviewStatus: true,
          authorId: true,
        },
      });

      expect(createdQuestion).not.toHaveProperty("answerKey");
    });

    it("returns 500 when an unexpected database error occurs", async () => {
      mockCreate.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { req, res } = createMocks();

      await createQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while creating the question.",
      });
      expect(mockCreate).toHaveBeenCalledTimes(1);

      consoleError.mockRestore();
    });
  });

  describe("loadQuestions", () => {
    it("returns approved questions with default pagination", async () => {
      const questions = [
        {
          id: "00000000-0000-0000-0000-000000000003",
          answerType: "SHORT_ANSWER",
          content: validQuestion.content,
          category: validQuestion.category,
          difficulty: validQuestion.difficulty,
        },
      ];
  
      mockFindMany.mockResolvedValue(questions);
      mockCount.mockResolvedValue(1);
  
      const { req, res } = createMocks();
  
      await loadQuestions(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        questions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
  
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { reviewStatus: "APPROVED" },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
        skip: 0,
        take: 20,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          answerType: true,
          content: true,
          category: true,
          difficulty: true,
        },
      });
  
      expect(mockCount).toHaveBeenCalledWith({
        where: { reviewStatus: "APPROVED" },
      });
  
      expect(questions[0]).not.toHaveProperty("answerKey");
    });
  
    it("uses the requested pagination parameters", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(45);
  
      const { req, res } = createMocks();
  
      req.query = {
        page: "2",
        limit: "10",
      };
  
      await loadQuestions(req, res);
  
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
  
      expect(res.json).toHaveBeenCalledWith({
        questions: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 45,
          totalPages: 5,
        },
      });
    });
  
    it("returns 400 for invalid pagination parameters", async () => {
      const { req, res } = createMocks();
  
      req.query = {
        page: "0",
        limit: "101",
      };
  
      await loadQuestions(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockFindMany).not.toHaveBeenCalled();
      expect(mockCount).not.toHaveBeenCalled();
    });
  
    it("returns 200 with an empty result when no questions are approved", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
  
      const { req, res } = createMocks();
  
      await loadQuestions(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        questions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    });
  
    it("returns 500 when the database query fails", async () => {
      mockFindMany.mockRejectedValue(
        new Error("Database connection failed"),
      );
  
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
  
      const { req, res } = createMocks();
  
      await loadQuestions(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while loading questions.",
      });
  
      consoleError.mockRestore();
    });
  });
});
