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
