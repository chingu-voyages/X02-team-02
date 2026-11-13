import { z } from "zod";
import type { PracticeOption } from "../practice";

export const startExamRequestSchema = z
  .object({
    category: z.string().trim().min(1).max(100),
  })
  .strict();

export type StartExamRequest = z.infer<typeof startExamRequestSchema>;

// A question as shown during an exam. It never includes the answer key.
// `id` is the AttemptQuestion id, not the original Question id.
export type ExamQuestion =
  | {
      id: string;
      position: number;
      answerType: "MULTIPLE_CHOICE";
      text: string;
      options: PracticeOption[];
      // True when more than one option is correct ("select all that apply").
      multiple: boolean;
    }
  | {
      id: string;
      position: number;
      answerType: "SHORT_ANSWER";
      text: string;
    };

// Response of POST /api/exams
export type StartExamResponse = {
  attemptId: string;
  resumed: boolean;
  questions: ExamQuestion[];
};

// Response of GET /api/exams/categories
export type GetCategoriesResponse = {
  categories: string[];
};
