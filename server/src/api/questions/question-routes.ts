import { Router } from "express";
import { requireAuth } from "../auth/session-middleware.js";
import {
  createQuestion,
  loadQuestions,
} from "./question-handlers.js";

const questionRoutes = Router();

questionRoutes.get("/", requireAuth, loadQuestions);
questionRoutes.post("/create", requireAuth, createQuestion);

export default questionRoutes;
