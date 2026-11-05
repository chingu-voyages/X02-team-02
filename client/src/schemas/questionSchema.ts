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
  answerType: z.literal("MULTIPLE_CHOICE"),
  options: z
    .array(optionSchema)
    .min(2, "Add at least 2 answer options")
    .max(10, "At most 10 answer options")
    .refine((opts) => opts.some((o) => o.isCorrect), {
      message: "Tick at least one correct option",
    }),
});

const shortAnswerSchema = basefields.extend({
  answerType: z.literal("SHORT_ANSWER"),
  modelAnswer: z.string().trim().min(1, "Provide a model answer"),
});

export const questionFormSchema = z.discriminatedUnion("answerType", [
  multipleChoiceSchema,
  shortAnswerSchema,
]);

export type QuestionFormValues = z.infer<typeof questionFormSchema>;
