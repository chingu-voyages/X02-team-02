import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock("../../db/prisma.js", () => ({
  prisma: { question: { findMany: mockFindMany } },
}));

const { default: app } = await import("../../app.js");

const mcId = "11111111-1111-4111-8111-111111111111";
const multiId = "22222222-2222-4222-8222-222222222222";
const shortId = "33333333-3333-4333-8333-333333333333";

const rows = [
  {
    id: mcId,
    answerType: "MULTIPLE_CHOICE",
    category: "PSM",
    content: {
      text: "Who owns the Product Backlog?",
      options: [
        { id: "a", text: "The Product Owner" },
        { id: "b", text: "The Scrum Master" },
      ],
    },
    answerKey: { correctOptionIds: ["a"] },
  },
  {
    id: multiId,
    answerType: "MULTIPLE_CHOICE",
    category: "PSM",
    content: {
      text: "Which are Scrum events?",
      options: [
        { id: "a", text: "Sprint Planning" },
        { id: "b", text: "Daily Scrum" },
        { id: "c", text: "Gantt Review" },
      ],
    },
    answerKey: { correctOptionIds: ["a", "b"] },
  },
  {
    id: shortId,
    answerType: "SHORT_ANSWER",
    category: "PSM",
    content: { text: "How many minutes is the Daily Scrum?" },
    answerKey: { acceptedAnswers: ["15"] },
  },
];

beforeEach(() => {
  // mockReset also drops queued mockResolvedValueOnce values left by earlier tests.
  mockFindMany.mockReset();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/practice/questions", () => {
  beforeEach(() => {
    // First call picks IDs, second call loads the chosen rows.
    mockFindMany
      .mockResolvedValueOnce(rows.map((row) => ({ id: row.id })))
      .mockResolvedValueOnce(rows);
  });

  it("works without logging in and never includes answer keys", async () => {
    const response = await request(app).get("/api/practice/questions");

    expect(response.status).toBe(200);
    expect(response.body.questions).toHaveLength(3);
    expect(JSON.stringify(response.body)).not.toContain("answerKey");
    expect(JSON.stringify(response.body)).not.toContain("correctOptionIds");
    expect(JSON.stringify(response.body)).not.toContain("acceptedAnswers");
  });

  it("flags multi-answer questions so the screen can show checkboxes", async () => {
    const response = await request(app).get("/api/practice/questions");
    const byId = new Map(
      response.body.questions.map((q: { id: string }) => [q.id, q]),
    );

    expect((byId.get(mcId) as { multiple: boolean }).multiple).toBe(false);
    expect((byId.get(multiId) as { multiple: boolean }).multiple).toBe(true);
  });

  it("asks only for approved, auto-gradable questions", async () => {
    await request(app).get("/api/practice/questions");

    expect(mockFindMany.mock.calls[0][0].where).toEqual({
      reviewStatus: "APPROVED",
      answerType: { in: ["MULTIPLE_CHOICE", "SHORT_ANSWER"] },
    });
  });

  it("respects the requested count", async () => {
    const response = await request(app).get("/api/practice/questions?count=2");

    expect(response.status).toBe(200);
    expect(mockFindMany.mock.calls[1][0].where.id.in).toHaveLength(2);
  });

  it("rejects an invalid count", async () => {
    for (const count of ["0", "51", "abc", "-1"]) {
      const response = await request(app).get(`/api/practice/questions?count=${count}`);

      expect(response.status, `count=${count}`).toBe(400);
    }
  });
});

describe("POST /api/practice/grade", () => {
  it("grades a quiz and reveals the correct answers", async () => {
    mockFindMany.mockResolvedValueOnce(rows);

    const response = await request(app)
      .post("/api/practice/grade")
      .send({
        answers: [
          { questionId: mcId, optionIds: ["a"] },
          { questionId: multiId, optionIds: ["a"] },
          { questionId: shortId, text: "15" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.score).toBe(2);
    expect(response.body.total).toBe(3);
    expect(response.body.results.map((r: { isCorrect: boolean }) => r.isCorrect)).toEqual([
      true,
      false,
      true,
    ]);
    expect(response.body.results[1].correctAnswer).toBe("Sprint Planning, Daily Scrum");
  });

  it("rejects a malformed body", async () => {
    const response = await request(app)
      .post("/api/practice/grade")
      .send({ answers: [{ questionId: "not-a-uuid" }] });

    expect(response.status).toBe(400);
    expect(response.body.fieldErrors.length).toBeGreaterThan(0);
  });

  it("rejects a question that is not available", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const response = await request(app)
      .post("/api/practice/grade")
      .send({ answers: [{ questionId: mcId, optionIds: ["a"] }] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Unknown question.");
  });
});

describe("the on/off switch", () => {
  it("is on by default outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockFindMany.mockResolvedValueOnce([]);

    const response = await request(app).get("/api/practice/questions");

    expect(response.status).toBe(200);
  });

  it("is off by default in production, so the routes answer 404", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const questions = await request(app).get("/api/practice/questions");
    const grade = await request(app).post("/api/practice/grade").send({});

    expect(questions.status).toBe(404);
    expect(grade.status).toBe(404);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("can be turned on in production with ENABLE_PUBLIC_PRACTICE=true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_PUBLIC_PRACTICE", "true");
    mockFindMany.mockResolvedValueOnce([]);

    const response = await request(app).get("/api/practice/questions");

    expect(response.status).toBe(200);
  });

  it("can be turned off in development with ENABLE_PUBLIC_PRACTICE=false", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_PUBLIC_PRACTICE", "false");

    const response = await request(app).get("/api/practice/questions");

    expect(response.status).toBe(404);
  });
});
