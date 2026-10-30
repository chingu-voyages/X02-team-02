import { createQuestionSchema } from "@x02/shared";

export function validateCreateQuestion(input: unknown) {
  return createQuestionSchema.safeParse(input);
}
