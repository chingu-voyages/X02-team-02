// client/src/api/auth.ts
import type { AuthResponse, LoginRequest, RegisterRequest } from "@x02/shared";
import { apiFetch } from "./client.ts";

export const register = (body: RegisterRequest) =>
  apiFetch<AuthResponse>("/auth/register", { method: "POST", body });
export const login = (body: LoginRequest) =>
  apiFetch<AuthResponse>("/auth/login", { method: "POST", body });
export const logout = () => apiFetch<void>("/auth/logout", { method: "POST" });
export const getMe = () => apiFetch<AuthResponse>("/auth/me");

export type ForgotPasswordResponse = {
  message: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export const requestPasswordReset = (email: string) =>
  apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });

export const resetPassword = (token: string, password: string) =>
  apiFetch<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
