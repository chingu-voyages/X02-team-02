import { Router } from "express";
import { login, register } from "./auth-handlers.js";
import {
  logout,
  me,
} from "./auth-session-handlers.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", me);

export default authRoutes;
