import { Router } from "express";
import { requireAuth } from "../auth/session-middleware.js";
import { createQuestion, loadQuestions } from "./question-handlers.js";

const questionRoutes = Router();

// The questions page is accessible to all authenticated users.
questionRoutes.get("/", requireAuth, loadQuestions);

// Authenticated users of any role may submit questions.
questionRoutes.post("/create", requireAuth, createQuestion);

export default questionRoutes;
