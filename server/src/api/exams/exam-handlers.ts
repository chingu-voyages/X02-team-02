import type { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { startExamRequestSchema, type ExamQuestion } from "@x02/shared";
import { shuffle, parseStoredQuestion } from "../../utils/utils.js";
import type {
  AttemptQuestion,
  Prisma,
} from "../../../generated/prisma/client.js";

const GRADABLE_TYPES = ["MULTIPLE_CHOICE", "SHORT_ANSWER"] as const;
type NewAttemptQuestion =
  Prisma.AttemptQuestionUncheckedCreateWithoutAttemptInput;
const EXAM_QUESTION_COUNT = 20;

export async function getCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const categoriesData = await prisma.question.findMany({
      where: {
        reviewStatus: "APPROVED",
        answerType: { in: [...GRADABLE_TYPES] },
      },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });

    const categories = categoriesData.map((entry) => entry.category);

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Failed to load exam categories:", error);

    res.status(500).json({ error: "Unable to load exam categories." });
  }
}

// map over fetched attempt questions and exclude answers
function toExamQuestions(
  rows: AttemptQuestion[],
  category: string,
): ExamQuestion[] {
  const questions: ExamQuestion[] = [];

  for (const row of rows) {
    const question = parseStoredQuestion({
      answerType: row.answerType,
      content: row.content,
      answerKey: row.answerKey,
      category,
    });
    if (!question) continue;

    if (question.answerType === "MULTIPLE_CHOICE") {
      questions.push({
        id: row.id,
        position: row.position,
        answerType: "MULTIPLE_CHOICE",
        text: question.content.text,
        options: question.content.options,
        multiple: question.answerKey.correctOptionIds.length > 1,
      });
    } else {
      questions.push({
        id: row.id,
        position: row.position,
        answerType: "SHORT_ANSWER",
        text: question.content.text,
      });
    }
  }

  return questions;
}

export async function startExam(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const user = req.user;

  if (user.status === "BLOCKED") {
    res.status(403).json({
      error: "Blocked users cannot take exams.",
    });
    return;
  }

  const body = startExamRequestSchema.safeParse(req.body);

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

  const { category } = body.data;

  try {
    // check if an unfinished attempt of the same category already exists
    const existingAttempt = await prisma.attempt.findFirst({
      where: {
        category,
        userId: user.id,
        finishedAt: null,
      },
      include: { questions: { orderBy: { position: "asc" } } },
    });

    // return the unfinished attempt instead of starting a new one
    if (existingAttempt) {
      res.status(200).json({
        attemptId: existingAttempt.id,
        resumed: true,
        questions: toExamQuestions(existingAttempt.questions, category),
      });
      return;
    }

    // fetch Ids of all questions of selected category
    const candidates = await prisma.question.findMany({
      where: {
        reviewStatus: "APPROVED",
        answerType: { in: [...GRADABLE_TYPES] },
        category,
      },
      select: { id: true },
    });

    if (candidates.length === 0) {
      res
        .status(404)
        .json({ error: `No questions found for '${category}' category` });
      return;
    }

    // shuffle Ids and limit the length
    const chosenIds = shuffle(candidates.map((row) => row.id)).slice(
      0,
      EXAM_QUESTION_COUNT,
    );

    // get selected question fields for chosen Ids and save in a Map
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

    const attemptQuestions: NewAttemptQuestion[] = [];

    // save selected fields of each question so that it matches AttemptQuestion
    for (const id of chosenIds) {
      const row = rowsById.get(id);
      const question = row ? parseStoredQuestion(row) : null;

      if (!question) continue;

      const position = attemptQuestions.length + 1;

      if (question.answerType === "MULTIPLE_CHOICE") {
        attemptQuestions.push({
          position,
          questionId: id,
          answerType: "MULTIPLE_CHOICE",
          content: {
            text: question.content.text,
            options: shuffle(question.content.options),
          },
          answerKey: question.answerKey,
        });
      } else {
        attemptQuestions.push({
          position,
          questionId: id,
          answerType: "SHORT_ANSWER",
          content: question.content,
          answerKey: question.answerKey,
        });
      }
    }

    if (attemptQuestions.length === 0) {
      res
        .status(404)
        .json({ error: `No questions found for '${category}' category` });
      return;
    }

    // create new attempt and attempt questions
    const attempt = await prisma.attempt.create({
      data: {
        category,
        userId: user.id,
        questions: { create: attemptQuestions },
      },
      include: { questions: { orderBy: { position: "asc" } } },
    });

    res
      .status(201)
      .json({
        attemptId: attempt.id,
        resumed: false,
        questions: toExamQuestions(attempt.questions, category),
      });
  } catch (error) {
    console.error("Failed to load exam questions:", error);

    res.status(500).json({ error: "Unable to load exam questions." });
  }
}
