// client/src/api/auth.ts
import type { AuthResponse, LoginRequest, RegisterRequest } from "@x02/shared";
import { apiFetch } from "./client.ts";

export const register = (body: RegisterRequest) =>
  apiFetch<AuthResponse>("/auth/register", { method: "POST", body });
export const login = (body: LoginRequest) =>
  apiFetch<AuthResponse>("/auth/login", { method: "POST", body });
export const logout = () => apiFetch<void>("/auth/logout", { method: "POST" });
export const getMe = () => apiFetch<AuthResponse>("/auth/me");