import type { GradableQuestion } from "../api/practice/grading.ts";
import { createQuestionSchema } from "@x02/shared";

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

// The stored JSON is checked with the same schema the create endpoint uses, so a
// row that no longer matches is skipped instead of breaking the whole quiz.
export function parseStoredQuestion(row: {
  answerType: string;
  content: unknown;
  answerKey: unknown;
  category: string;
}): GradableQuestion | null {
  const parsed = createQuestionSchema.safeParse({
    answerType: row.answerType,
    content: row.content,
    answerKey: row.answerKey,
    category: row.category,
  });

  if (!parsed.success || parsed.data.answerType === "ESSAY") {
    return null;
  }

  return parsed.data;
}
