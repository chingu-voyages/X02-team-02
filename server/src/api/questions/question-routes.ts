import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../auth/session-middleware.js";
import {
  createQuestion,
  loadQuestions,
} from "./question-handlers.js";

const questionRoutes = Router();

// The admin question-management page is restricted to administrators.
questionRoutes.get("/", requireRole("ADMIN"), loadQuestions);

// Authenticated users of any role may submit questions.
questionRoutes.post("/create", requireAuth, createQuestion);

export default questionRoutes;
