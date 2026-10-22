import { Router } from "express";
import authRoutes from "./auth/auth-routes.js";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);

export default apiRoutes;
