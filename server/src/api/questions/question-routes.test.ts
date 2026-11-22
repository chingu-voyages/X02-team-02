import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachUser } from "../auth/session-middleware.js";
import questionRoutes from "./question-routes.js";

const {
  mockGetSessionUser,
  mockCreateQuestion,
  mockLoadQuestions,
} = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
  mockCreateQuestion: vi.fn(),
  mockLoadQuestions: vi.fn(),
}));

vi.mock("../auth/session.js", () => ({
  getSessionUser: mockGetSessionUser,
}));

vi.mock("./question-handlers.js", () => ({
  createQuestion: mockCreateQuestion,
  loadQuestions: mockLoadQuestions,
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

function buildApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(attachUser);
  app.use("/api/questions", questionRoutes);

  return app;
}

describe("Question routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLoadQuestions.mockImplementation((_req, res) => {
      res.status(200).json({ questions: [] });
    });

    mockCreateQuestion.mockImplementation((_req, res) => {
      res.status(201).json({ message: "Question submitted." });
    });
  });

  describe("GET /api/questions", () => {
    it("returns 401 when the user is not authenticated", async () => {
      const response = await request(buildApp()).get("/api/questions");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Authentication required.",
      });
      expect(mockLoadQuestions).not.toHaveBeenCalled();
    });

    it.each([
      ["LEARNER", users.LEARNER],
      ["QUESTION_MANAGER", users.QUESTION_MANAGER],
    ] as const)(
      "returns 403 for %s",
      async (_role, user) => {
        mockGetSessionUser.mockResolvedValue(user);

        const response = await request(buildApp())
          .get("/api/questions")
          .set("Cookie", "sid=valid-session");

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
          error: "Forbidden.",
        });
        expect(mockLoadQuestions).not.toHaveBeenCalled();
      },
    );

    it("allows ADMIN to retrieve questions", async () => {
      mockGetSessionUser.mockResolvedValue(users.ADMIN);

      const response = await request(buildApp())
        .get("/api/questions")
        .set("Cookie", "sid=valid-session");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ questions: [] });
      expect(mockLoadQuestions).toHaveBeenCalledOnce();
    });
  });

  describe("POST /api/questions/create", () => {
    it("returns 401 when the user is not authenticated", async () => {
      const response = await request(buildApp())
        .post("/api/questions/create")
        .send({});

      expect(response.status).toBe(401);
      expect(mockCreateQuestion).not.toHaveBeenCalled();
    });

    it.each([
      ["LEARNER", users.LEARNER],
      ["QUESTION_MANAGER", users.QUESTION_MANAGER],
      ["ADMIN", users.ADMIN],
    ] as const)(
      "allows %s to submit a question",
      async (_role, user) => {
        mockGetSessionUser.mockResolvedValue(user);

        const response = await request(buildApp())
          .post("/api/questions/create")
          .set("Cookie", "sid=valid-session")
          .send({});

        expect(response.status).toBe(201);
        expect(mockCreateQuestion).toHaveBeenCalledOnce();
      },
    );
  });
});
