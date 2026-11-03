import type { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { validateCreateQuestion } from "./question-validation.js";

export async function createQuestion(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const user = req.user;

  if (user.status === "BLOCKED") {
    res.status(403).json({
      message: "Blocked users cannot submit questions.",
    });
    return;
  }

  const validation = validateCreateQuestion(req.body);

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed.",
      fieldErrors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const {
    answerType,
    content,
    answerKey,
    category,
    difficulty,
  } = validation.data;

  try {
    const question = await prisma.question.create({
      data: {
        answerType,
        content,
        answerKey,
        category,
        difficulty,
        reviewStatus: "PENDING",
        authorId: user.id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        answerType: true,
        content: true,
        category: true,
        difficulty: true,
        reviewStatus: true,
        authorId: true,
      },
    });

    res.status(201).json({
      message: "Question submitted for review.",
      question,
    });
  } catch (error) {
    console.error("Failed to create question:", error);

    res.status(500).json({
      message: "An error occurred while creating the question.",
    });
  }
}

export async function loadQuestions(
  req: Request,
  res: Response,
): Promise<void> {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  const parseQueryNumber = (
    value: unknown,
    defaultValue: number,
  ): number | null => {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== "string" || value.trim() === "") {
      return null;
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed > 0
      ? parsed
      : null;
  };

  const page = parseQueryNumber(req.query?.page, DEFAULT_PAGE);
  const limit = parseQueryNumber(req.query?.limit, DEFAULT_LIMIT);

  if (page === null || limit === null || limit > MAX_LIMIT) {
    res.status(400).json({
      error: "Invalid pagination parameters.",
      fieldErrors: [
        ...(page === null
          ? [{ field: "page", message: "Page must be a positive integer." }]
          : []),
        ...(limit === null || limit > MAX_LIMIT
          ? [{
              field: "limit",
              message: `Limit must be a positive integer no greater than ${MAX_LIMIT}.`,
            }]
          : []),
      ],
    });
    return;
  }

  const skip = (page - 1) * limit;

  try {
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: {
          reviewStatus: "APPROVED",
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          answerType: true,
          content: true,
          category: true,
          difficulty: true,
        },
      }),
      prisma.question.count({
        where: {
          reviewStatus: "APPROVED",
        },
      }),
    ]);

    res.status(200).json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to load questions:", error);

    res.status(500).json({
      message: "An error occurred while loading questions.",
    });
  }
}
