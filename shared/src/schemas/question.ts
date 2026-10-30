import { z } from "zod";

export const questionContentSchema = z
  .object({
    text: z.string().trim().min(1),
  })
  .strict();

export const questionAnswerKeySchema = z
  .object({
    correctAnswer: z.string().trim().min(1),
  })
  .strict();

export const createQuestionSchema = z
  .object({
    content: questionContentSchema,
    answerKey: questionAnswerKeySchema,
    category: z.string().trim().min(1).max(100).optional(),
    difficulty: z.string().trim().min(1).max(50).optional(),
  })
  .strict();

export type CreateQuestionInput = z.infer<
  typeof createQuestionSchema
>;
