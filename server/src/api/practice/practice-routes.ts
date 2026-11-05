import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { getPracticeQuestions, gradePractice } from "./practice-handlers.js";

// The practice quiz is a public demo: no login needed. It is on by default in
// development and off in production. Set ENABLE_PUBLIC_PRACTICE=true or false to
// override either way. When off, the routes answer 404 as if they did not exist.
export function isPracticeEnabled(): boolean {
  const setting = process.env.ENABLE_PUBLIC_PRACTICE;

  if (setting !== undefined) {
    return setting === "true";
  }

  return process.env.NODE_ENV !== "production";
}

function requirePracticeEnabled(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!isPracticeEnabled()) {
    res.status(404).json({ error: "Not found." });
    return;
  }

  next();
}

const practiceRoutes = Router();

practiceRoutes.use(requirePracticeEnabled);
practiceRoutes.get("/questions", getPracticeQuestions);
practiceRoutes.post("/grade", gradePractice);

export default practiceRoutes;
