import { describe, expect, it } from "vitest";
import { gradeAnswer, normalizeText } from "./grading.js";
import type { GradableQuestion } from "./grading.js";

const singleChoice: GradableQuestion = {
  answerType: "MULTIPLE_CHOICE",
  category: "PSM",
  content: {
    text: "Who owns the Product Backlog?",
    options: [
      { id: "a", text: "The Product Owner" },
      { id: "b", text: "The Scrum Master" },
      { id: "c", text: "The Developers" },
    ],
  },
  answerKey: { correctOptionIds: ["a"] },
};

const multiChoice: GradableQuestion = {
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
};

const shortAnswer: GradableQuestion = {
  answerType: "SHORT_ANSWER",
  category: "PSM",
  content: { text: "How many minutes is the Daily Scrum?" },
  answerKey: { acceptedAnswers: ["15", "fifteen minutes"] },
};

const id = "00000000-0000-4000-8000-000000000001";

describe("normalizeText", () => {
  it("ignores case, extra spaces, and trailing punctuation", () => {
    expect(normalizeText("  Fifteen   Minutes. ")).toBe("fifteen minutes");
  });
});

describe("gradeAnswer: multiple choice", () => {
  it("marks the exact correct selection as correct", () => {
    const graded = gradeAnswer(singleChoice, { questionId: id, optionIds: ["a"] });

    expect(graded.isCorrect).toBe(true);
    expect(graded.yourAnswer).toBe("The Product Owner");
    expect(graded.correctAnswer).toBe("The Product Owner");
  });

  it("marks a wrong option as incorrect and still shows the correct answer", () => {
    const graded = gradeAnswer(singleChoice, { questionId: id, optionIds: ["b"] });

    expect(graded.isCorrect).toBe(false);
    expect(graded.yourAnswer).toBe("The Scrum Master");
    expect(graded.correctAnswer).toBe("The Product Owner");
  });

  it("requires every correct option on a multi-answer question", () => {
    expect(
      gradeAnswer(multiChoice, { questionId: id, optionIds: ["a", "b"] }).isCorrect,
    ).toBe(true);
    expect(
      gradeAnswer(multiChoice, { questionId: id, optionIds: ["a"] }).isCorrect,
    ).toBe(false);
  });

  it("marks the correct options plus an extra wrong one as incorrect", () => {
    const graded = gradeAnswer(multiChoice, {
      questionId: id,
      optionIds: ["a", "b", "c"],
    });

    expect(graded.isCorrect).toBe(false);
  });

  it("marks a skipped question as incorrect", () => {
    const graded = gradeAnswer(singleChoice, { questionId: id });

    expect(graded.isCorrect).toBe(false);
    expect(graded.yourAnswer).toBe("(no answer)");
  });

  it("ignores option IDs that do not exist", () => {
    expect(
      gradeAnswer(singleChoice, { questionId: id, optionIds: ["zzz"] }).isCorrect,
    ).toBe(false);
  });
});

describe("gradeAnswer: short answer", () => {
  it("accepts any accepted answer, ignoring case and spacing", () => {
    expect(gradeAnswer(shortAnswer, { questionId: id, text: "15" }).isCorrect).toBe(true);
    expect(
      gradeAnswer(shortAnswer, { questionId: id, text: "  Fifteen  Minutes. " }).isCorrect,
    ).toBe(true);
  });

  it("rejects a wrong answer and lists the accepted ones", () => {
    const graded = gradeAnswer(shortAnswer, { questionId: id, text: "20" });

    expect(graded.isCorrect).toBe(false);
    expect(graded.correctAnswer).toBe("15 or fifteen minutes");
  });

  it("treats an empty answer as incorrect", () => {
    expect(gradeAnswer(shortAnswer, { questionId: id, text: "   " }).isCorrect).toBe(false);
    expect(gradeAnswer(shortAnswer, { questionId: id }).isCorrect).toBe(false);
  });
});
