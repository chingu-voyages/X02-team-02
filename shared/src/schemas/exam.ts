import { z } from "zod";
import type { PracticeOption } from "../practice";

export const MAX_EXAM_QUESTION_COUNT = 50;

export const startExamRequestSchema = z
  .object({
    category: z.string().trim().min(1).max(100),
    count: z.number().int().min(1).max(MAX_EXAM_QUESTION_COUNT).optional(),
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
      answer?: SaveAnswerRequest;
    }
  | {
      id: string;
      position: number;
      answerType: "SHORT_ANSWER";
      text: string;
      answer?: SaveAnswerRequest;
    };

// Response of POST /api/exams
export type StartExamResponse = {
  attemptId: string;
  resumed: boolean;
};

// Response of GET /api/exams/categories
export type GetCategoriesResponse = {
  categories: string[];
};

// Response of GET /api/exams/:attemptId
export type GetExamResponse = {
  attemptId: string;
  category: string;
  questions: ExamQuestion[];
};

export const attemptIdSchema = z.uuid();

export const saveAnswerRequestSchema = z
  .object({
    optionIds: z.array(z.string().min(1).max(50)).max(10).optional(),
    text: z.string().max(1_000).optional(),
  })
  .strict();

export type SaveAnswerRequest = z.infer<typeof saveAnswerRequestSchema>;

export type SubmitExamResponse = {
  attemptId: string;
  score: number;
  total: number;
};

export type ExamResultQuestion = {
  id: string;
  text: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  position: number;
};

export type GetExamResultResponse = {
  attemptId: string;
  category: string;
  score: number;
  total: number;
  finishedAt: string;
  results: ExamResultQuestion[];
};
