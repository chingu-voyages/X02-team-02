import { z } from "zod";

const questionTextSchema = z.string().trim().min(1).max(5_000);

const categorySchema = z.string().trim().min(1).max(100);

const difficultySchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .optional();


// MULTIPLE_CHOICE

const multipleChoiceContentSchema = z
  .object({
    text: questionTextSchema,
    options: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(50),
          text: z.string().trim().min(1).max(1_000),
        }).strict(),
      )
      .min(2)
      .max(10),
  })
  .strict()
  .superRefine((content, ctx) => {
    const optionIds = content.options.map((option) => option.id);

    if (new Set(optionIds).size !== optionIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Option IDs must be unique.",
        path: ["options"],
      });
    }
  });

const multipleChoiceAnswerKeySchema = z
  .object({
    correctOptionIds: z.array(z.string().trim().min(1).max(50)).min(1),
  })
  .strict();

const multipleChoiceQuestionSchema = z
  .object({
    answerType: z.literal("MULTIPLE_CHOICE"),
    content: multipleChoiceContentSchema,
    answerKey: multipleChoiceAnswerKeySchema,
    category: categorySchema,
    difficulty: difficultySchema,
  })
  .strict()
  .superRefine((question, ctx) => {
    const optionIds = new Set(
      question.content.options.map((option) => option.id),
    );

    question.answerKey.correctOptionIds.forEach((optionId, index) => {
      if (!optionIds.has(optionId)) {
        ctx.addIssue({
          code: "custom",
          message: `Correct option "${optionId}" does not exist.`,
          path: ["answerKey", "correctOptionIds", index],
        });
      }
    });

    if (
      new Set(question.answerKey.correctOptionIds).size !==
      question.answerKey.correctOptionIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Correct option IDs must be unique.",
        path: ["answerKey", "correctOptionIds"],
      });
    }
  });


// SHORT_ANSWER

const shortAnswerContentSchema = z
  .object({
    text: questionTextSchema,
  })
  .strict();

const shortAnswerAnswerKeySchema = z
  .object({
    acceptedAnswers: z
      .array(z.string().trim().min(1).max(1_000))
      .min(1)
      .max(50),
  })
  .strict();

const shortAnswerQuestionSchema = z
  .object({
    answerType: z.literal("SHORT_ANSWER"),
    content: shortAnswerContentSchema,
    answerKey: shortAnswerAnswerKeySchema,
    category: categorySchema,
    difficulty: difficultySchema,
  })
  .strict();


// ESSAY

const essayContentSchema = z
  .object({
    text: questionTextSchema,
  })
  .strict();

const essayAnswerKeySchema = z
  .object({
    rubric: z.string().trim().min(1).max(10_000),
  })
  .strict();

const essayQuestionSchema = z
  .object({
    answerType: z.literal("ESSAY"),
    content: essayContentSchema,
    answerKey: essayAnswerKeySchema,
    category: categorySchema,
    difficulty: difficultySchema,
  })
  .strict();


export const createQuestionSchema = z.discriminatedUnion("answerType", [
  multipleChoiceQuestionSchema,
  shortAnswerQuestionSchema,
  essayQuestionSchema,
]);

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
