import { z } from "zod";

// Types and request schema for the public practice quiz API (/api/practice/*).
// This is a demo feature that can be switched off in production.

export type PracticeOption = { id: string; text: string };

// A question as shown to the learner. It never includes the answer key.
export type PracticeQuestion =
  | {
      id: string;
      answerType: "MULTIPLE_CHOICE";
      text: string;
      options: PracticeOption[];
      // True when more than one option is correct ("select all that apply").
      multiple: boolean;
    }
  | {
      id: string;
      answerType: "SHORT_ANSWER";
      text: string;
    };

export type PracticeQuestionsResponse = {
  questions: PracticeQuestion[];
};

// One entry per question shown. A skipped question has an empty answer.
export const practiceGradeRequestSchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            questionId: z.uuid(),
            optionIds: z.array(z.string().min(1).max(50)).max(10).optional(),
            text: z.string().max(1_000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();

export type PracticeGradeRequest = z.infer<typeof practiceGradeRequestSchema>;
export type PracticeAnswer = PracticeGradeRequest["answers"][number];

export type PracticeResult = {
  questionId: string;
  text: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

export type PracticeGradeResponse = {
  score: number;
  total: number;
  results: PracticeResult[];
};
