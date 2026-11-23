import { Router } from "express";
import { requireAuth } from "../auth/session-middleware.js";
import {
  getCategories,
  startExam,
  getExam,
  saveAnswer,
  submitExam,
  getExamResult,
  getExamsHistory,
} from "./exam-handlers.js";

const examRoutes = Router();

examRoutes.get("/categories", requireAuth, getCategories);
examRoutes.get("/history", requireAuth, getExamsHistory);
examRoutes.get("/:attemptId", requireAuth, getExam);
examRoutes.post("/", requireAuth, startExam);
examRoutes.put(
  "/:attemptId/questions/:questionId/answer",
  requireAuth,
  saveAnswer,
);
examRoutes.post("/:attemptId/submit", requireAuth, submitExam);
examRoutes.get("/:attemptId/result", requireAuth, getExamResult);

export default examRoutes;
