import { Router } from "express";
import { register } from "./auth-handlers.js";

const authRoutes = Router();

authRoutes.post("/register", register);

export default authRoutes;
