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
import {
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
} from "./password-reset-rate-limit.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", me);

authRoutes.post(
  "/forgot-password",
  forgotPasswordRateLimit,
  forgotPassword,
);

authRoutes.post(
  "/reset-password",
  resetPasswordRateLimit,
  resetPassword,
);

export default authRoutes;
