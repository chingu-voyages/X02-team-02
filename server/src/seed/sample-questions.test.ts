import { describe, expect, it } from "vitest";
import { loadSampleQuestions, uuidFromSeedId } from "./sample-questions.js";

describe("sample questions", () => {
  const questions = loadSampleQuestions();

  it("loads and validates every entry against the shared schema", () => {
    expect(questions.length).toBeGreaterThanOrEqual(25);
  });

  it("has more than 20 questions so two 20-question quizzes can differ", () => {
    expect(questions.length).toBeGreaterThan(20);
  });

  it("has unique seed IDs and unique database IDs", () => {
    const seedIds = questions.map((q) => q.seedId);
    const ids = questions.map((q) => q.id);

    expect(new Set(seedIds).size).toBe(seedIds.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers both auto-gradable types and includes multi-answer questions", () => {
    const types = new Set(questions.map((q) => q.question.answerType));

    expect(types.has("MULTIPLE_CHOICE")).toBe(true);
    expect(types.has("SHORT_ANSWER")).toBe(true);

    const multiAnswer = questions.filter(
      (q) =>
        q.question.answerType === "MULTIPLE_CHOICE" &&
        q.question.answerKey.correctOptionIds.length > 1,
    );
    expect(multiAnswer.length).toBeGreaterThan(0);
  });

  it("does not include essay questions, which nothing grades yet", () => {
    expect(questions.some((q) => q.question.answerType === "ESSAY")).toBe(false);
  });

  // The "New question" form offers PSM and PSPO, and a learner picks a
  // certification as the category. Seeded questions must use one of them.
  it("uses only categories that the question form offers", () => {
    const formCategories = new Set(["PSM", "PSPO"]);

    for (const { seedId, question } of questions) {
      expect(formCategories.has(question.category), seedId).toBe(true);
    }
  });
});

describe("uuidFromSeedId", () => {
  it("returns the same valid UUID every time for the same seed ID", () => {
    const first = uuidFromSeedId("scrum-001");

    expect(first).toBe(uuidFromSeedId("scrum-001"));
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("returns different UUIDs for different seed IDs", () => {
    expect(uuidFromSeedId("scrum-001")).not.toBe(uuidFromSeedId("scrum-002"));
  });
});
