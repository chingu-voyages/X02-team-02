import { z } from "zod";

const basefields = z.object({
  category: z.string().trim().min(1, "Select a category").max(100),
  questionText: z.string().trim().min(1, "Provide a question"),
});

const optionSchema = z.object({
  text: z.string().trim().min(1, "Answer option can't be empty"),
  isCorrect: z.boolean(),
});

const multipleChoiceSchema = basefields.extend({
  answerType: z.literal("multipleChoice"),
  options: z
    .array(optionSchema)
    .min(2, "Add at least 2 answer options")
    .max(4, "At most 4 answer options")
    .refine((opts) => opts.some((o) => o.isCorrect), {
      message: "Tick at least one correct option",
    }),
});

const shortAnswerSchema = basefields.extend({
  answerType: z.literal("shortAnswer"),
  modelAnswer: z.string().trim().min(1, "Provide a model answer"),
});

export const questionFormSchema = z.discriminatedUnion("answerType", [
  multipleChoiceSchema,
  shortAnswerSchema,
]);

export type QuestionFormValues = z.infer<typeof questionFormSchema>;
