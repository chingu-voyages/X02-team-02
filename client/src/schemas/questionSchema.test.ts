import { describe, it, expect } from "vitest";
import { questionFormSchema } from "./questionSchema";

const validQuestionInput = {
  category: " PSPO ",
  answerType: "MULTIPLE_CHOICE",
  questionText: "Who is responsible for maximizing the value of the product?",
  options: [
    {
      text: "A Lorem ipsum dolor sit amet, consectetur adipiscing elit",
      isCorrect: true,
    },
    {
      text: "B Lorem ipsum dolor sit amet, consectetur adipiscing elit",
      isCorrect: true,
    },
    {
      text: "C Lorem ipsum dolor sit amet, consectetur adipiscing elit",
      isCorrect: false,
    },
    {
      text: "D Lorem ipsum dolor sit amet, consectetur adipiscing elit",
      isCorrect: false,
    },
  ],
};

const validShortAnswerInput = {
  category: "PSM",
  answerType: "SHORT_ANSWER",
  questionText: "Who is responsible for maximizing the value of the product?",
  modelAnswer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
};

describe("questionSchema", () => {
  it("accepts fully valid input", () => {
    const result = questionFormSchema.safeParse(validQuestionInput);

    expect(result.success).toBe(true);
    expect(result.data?.category).toEqual("PSPO");
  });

  describe("category", () => {
    it("should fail when empty", () => {
      const input = { ...validQuestionInput, category: "" };
      const result = questionFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Select a category");
      expect(result.error?.issues[0].path).toEqual(["category"]);
    });
  });

  describe("options", () => {
    it("should fail with fewer than 2 options", () => {
      const input = {
        ...validQuestionInput,
        options: validQuestionInput.options.slice(0, 1),
      };
      const result = questionFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Add at least 2 answer options",
      );
      expect(result.error?.issues[0].path).toEqual(["options"]);
    });

    it("should fail with more than 10 options", () => {
      const input = {
        ...validQuestionInput,
        options: validQuestionInput.options
          .concat(validQuestionInput.options)
          .concat(validQuestionInput.options),
      };
      const result = questionFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("At most 10 answer options");
      expect(result.error?.issues[0].path).toEqual(["options"]);
    });

    it("should fail when an option text is empty", () => {
      const input = {
        ...validQuestionInput,
        options: validQuestionInput.options.map((o, i) =>
          i === 0 ? { ...o, text: "" } : o,
        ),
      };
      const result = questionFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Answer option can't be empty",
      );
      expect(result.error?.issues[0].path).toEqual(["options", 0, "text"]);
    });

    it("should fail when no option is marked correct", () => {
      const input = {
        ...validQuestionInput,
        options: validQuestionInput.options.map((option) => ({
          ...option,
          isCorrect: false,
        })),
      };
      const result = questionFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Tick at least one correct option",
      );
      expect(result.error?.issues[0].path).toEqual(["options"]);
    });
  });

  describe("validShortAnswerInput", () => {
    it("accepts fully valid input", () => {
      const result = questionFormSchema.safeParse(validShortAnswerInput);

      expect(result.success).toBe(true);
    });

    it("should fail when modelAnswer is empty", () => {
      const input = { ...validShortAnswerInput, modelAnswer: "" };
      const result = questionFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Provide a model answer");
      expect(result.error?.issues[0].path).toEqual(["modelAnswer"]);
    });
  });
});
