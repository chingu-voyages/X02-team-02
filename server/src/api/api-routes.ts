import { Router } from "express";
import authRoutes from "./auth/auth-routes.js";
import questionRoutes from "./questions/question-routes.js";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/questions", questionRoutes);

export default apiRoutes;
