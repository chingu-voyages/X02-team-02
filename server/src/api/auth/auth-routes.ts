import { Router } from "express";
import { login, register } from "./auth-handlers.js";
import {
  logout,
  me,
} from "./auth-session-handlers.js";
import {
  forgotPassword,
  resetPassword,
} from "./password-reset-handlers.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", me);

authRoutes.post(
  "/forgot-password",
  forgotPassword,
);

authRoutes.post(
  "/reset-password",
  resetPassword,
);

export default authRoutes;
