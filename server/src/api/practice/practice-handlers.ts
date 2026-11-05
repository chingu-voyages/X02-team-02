import type { Request, Response } from "express";
import { createQuestionSchema, practiceGradeRequestSchema } from "@x02/shared";
import type {
  PracticeGradeResponse,
  PracticeQuestion,
  PracticeResult,
} from "@x02/shared";
import { prisma } from "../../db/prisma.js";
import { gradeAnswer } from "./grading.js";
import type { GradableQuestion } from "./grading.js";

const DEFAULT_COUNT = 20;
const MAX_COUNT = 50;
const GRADABLE_TYPES = ["MULTIPLE_CHOICE", "SHORT_ANSWER"] as const;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

// The stored JSON is checked with the same schema the create endpoint uses, so a
// row that no longer matches is skipped instead of breaking the whole quiz.
function parseStoredQuestion(row: {
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

function parseCount(value: unknown): number | null {
  if (value === undefined) {
    return DEFAULT_COUNT;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const count = Number(value);

  return Number.isSafeInteger(count) && count > 0 && count <= MAX_COUNT
    ? count
    : null;
}

// Returns random approved questions in random order, WITHOUT their answer keys.
// Only the number of correct options is hinted (`multiple`), so the screen knows
// whether to show radio buttons or checkboxes.
export async function getPracticeQuestions(
  req: Request,
  res: Response,
): Promise<void> {
  const count = parseCount(req.query?.count);

  if (count === null) {
    res.status(400).json({
      error: "Invalid count.",
      fieldErrors: [
        {
          field: "count",
          message: `Count must be a whole number from 1 to ${MAX_COUNT}.`,
        },
      ],
    });
    return;
  }

  try {
    const candidates = await prisma.question.findMany({
      where: {
        reviewStatus: "APPROVED",
        answerType: { in: [...GRADABLE_TYPES] },
      },
      select: { id: true },
    });

    const chosenIds = shuffle(candidates.map((row) => row.id)).slice(0, count);

    if (chosenIds.length === 0) {
      res.status(200).json({ questions: [] });
      return;
    }

    const rows = await prisma.question.findMany({
      where: { id: { in: chosenIds } },
      select: {
        id: true,
        answerType: true,
        content: true,
        answerKey: true,
        category: true,
      },
    });
    const rowsById = new Map(rows.map((row) => [row.id, row]));

    const questions: PracticeQuestion[] = [];

    for (const id of chosenIds) {
      const row = rowsById.get(id);
      const question = row ? parseStoredQuestion(row) : null;

      if (!question) {
        continue;
      }

      if (question.answerType === "MULTIPLE_CHOICE") {
        questions.push({
          id,
          answerType: "MULTIPLE_CHOICE",
          text: question.content.text,
          options: shuffle(question.content.options),
          multiple: question.answerKey.correctOptionIds.length > 1,
        });
      } else {
        questions.push({
          id,
          answerType: "SHORT_ANSWER",
          text: question.content.text,
        });
      }
    }

    res.status(200).json({ questions });
  } catch (error) {
    console.error("Failed to load practice questions:", error);

    res.status(500).json({ error: "Unable to load practice questions." });
  }
}

// Grades a finished quiz. Correct answers are revealed here, only after the
// learner has submitted.
export async function gradePractice(
  req: Request,
  res: Response,
): Promise<void> {
  const body = practiceGradeRequestSchema.safeParse(req.body);

  if (!body.success) {
    res.status(400).json({
      error: "Validation failed.",
      fieldErrors: body.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const { answers } = body.data;

  try {
    const rows = await prisma.question.findMany({
      where: {
        id: { in: [...new Set(answers.map((answer) => answer.questionId))] },
        reviewStatus: "APPROVED",
        answerType: { in: [...GRADABLE_TYPES] },
      },
      select: {
        id: true,
        answerType: true,
        content: true,
        answerKey: true,
        category: true,
      },
    });
    const rowsById = new Map(rows.map((row) => [row.id, row]));

    const results: PracticeResult[] = [];
    let score = 0;

    for (const answer of answers) {
      const row = rowsById.get(answer.questionId);
      const question = row ? parseStoredQuestion(row) : null;

      if (!question) {
        res.status(400).json({
          error: "Unknown question.",
          fieldErrors: [
            {
              field: "answers",
              message: `Question ${answer.questionId} is not available.`,
            },
          ],
        });
        return;
      }

      const graded = gradeAnswer(question, answer);

      if (graded.isCorrect) {
        score++;
      }

      results.push({
        questionId: answer.questionId,
        text: question.content.text,
        yourAnswer: graded.yourAnswer,
        correctAnswer: graded.correctAnswer,
        isCorrect: graded.isCorrect,
      });
    }

    const response: PracticeGradeResponse = {
      score,
      total: results.length,
      results,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Failed to grade practice quiz:", error);

    res.status(500).json({ error: "Unable to grade the quiz." });
  }
}
