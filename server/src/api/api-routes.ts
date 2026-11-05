import { Router } from "express";
import authRoutes from "./auth/auth-routes.js";
import practiceRoutes from "./practice/practice-routes.js";
import questionRoutes from "./questions/question-routes.js";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/questions", questionRoutes);
// Public demo quiz. No login required, and switched off in production.
apiRoutes.use("/practice", practiceRoutes);

export default apiRoutes;
