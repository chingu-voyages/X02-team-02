import { Router } from "express";
import { requireAuth } from "../auth/session-middleware.js";
import { getCategories, startExam } from "./exam-handlers.js";

const examRoutes = Router();

examRoutes.get("/categories", requireAuth, getCategories);
examRoutes.post("/", requireAuth, startExam);

export default examRoutes;
