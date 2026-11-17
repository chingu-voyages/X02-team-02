import { Router } from "express";
import { requireAuth } from "../auth/session-middleware.js";
import {
  getCategories,
  startExam,
  getExam,
  saveAnswer,
} from "./exam-handlers.js";

const examRoutes = Router();

examRoutes.get("/categories", requireAuth, getCategories);
examRoutes.get("/:attemptId", requireAuth, getExam);
examRoutes.post("/", requireAuth, startExam);
examRoutes.put(
  "/:attemptId/questions/:questionId/answer",
  requireAuth,
  saveAnswer,
);

export default examRoutes;
