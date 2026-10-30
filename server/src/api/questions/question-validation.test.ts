import { describe, expect, it } from "vitest";
import { validateCreateQuestion } from "./question-validation.js";

describe("validateCreateQuestion", () => {
  const validInput = {
    content: {
      text: "What is 2 + 2?",
    },
    answerKey: {
      correctAnswer: "4",
    },
    category: "Mathematics",
    difficulty: "Easy",
  };

  it("accepts valid question data", () => {
    const result = validateCreateQuestion(validInput);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it.each([
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
});
