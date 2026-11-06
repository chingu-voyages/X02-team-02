import { describe, expect, it } from "vitest";
import { validateCreateQuestion } from "./question-validation.js";

describe("validateCreateQuestion", () => {
  const validInput = {
    answerType: "SHORT_ANSWER",
    content: {
      text: "What is 2 + 2?",
    },
    answerKey: {
      acceptedAnswers: ["4"],
    },
    category: "Mathematics",
    difficulty: "Easy",
  };

  const multipleChoiceInput = {
    answerType: "MULTIPLE_CHOICE",
    content: {
      text: "What is 2 + 2?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
      ],
    },
    answerKey: {
      correctOptionIds: ["b"],
    },
    category: "Mathematics",
    difficulty: "Easy",
  };

  const essayInput = {
    answerType: "ESSAY",
    content: {
      text: "Explain the importance of database normalization.",
    },
    answerKey: {
      rubric: "Award points for explaining reduced redundancy and improved data integrity.",
    },
    category: "Databases",
    difficulty: "Medium",
  };

  it.each([
    ["multiple-choice", multipleChoiceInput],
    ["short-answer", validInput],
    ["essay", essayInput],
  ])("accepts valid %s question data", (_description, input) => {
    expect(validateCreateQuestion(input).success).toBe(true);
  });

  it.each([
    ["missing answer type", { ...validInput, answerType: undefined }],
    ["missing content", { ...validInput, content: undefined }],
    ["missing answer key", { ...validInput, answerKey: undefined }],
    ["empty content", { ...validInput, content: {} }],
    ["empty answer key", { ...validInput, answerKey: {} }],
    [
      "category longer than 100 characters",
      { ...validInput, category: "a".repeat(101) },
    ],
    [
      "difficulty longer than 50 characters",
      { ...validInput, difficulty: "a".repeat(51) },
    ],
  ])("rejects %s", (_description, input) => {
    expect(validateCreateQuestion(input).success).toBe(false);
  });

  it("rejects unexpected review metadata", () => {
    const result = validateCreateQuestion({
      ...validInput,
      reviewStatus: "APPROVED",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-object content", () => {
    expect(
      validateCreateQuestion({
        ...validInput,
        content: "What is 2 + 2?",
      }).success,
    ).toBe(false);
  });

  it("rejects an unsupported answer type", () => {
    expect(
      validateCreateQuestion({
        ...validInput,
        answerType: "TRUE_FALSE",
      }).success,
    ).toBe(false);
  });
});
