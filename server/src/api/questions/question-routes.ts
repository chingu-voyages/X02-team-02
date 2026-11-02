import { Router } from "express";
import { requireAuth } from "../auth/session-middleware.js";
import { createQuestion } from "./question-handlers.js";

const questionRoutes = Router();

questionRoutes.post("/create", requireAuth, createQuestion);

export default questionRoutes;
