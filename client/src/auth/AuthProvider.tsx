import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LoginRequest, User } from "@x02/shared";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
} from "../api/auth.ts";
import { AuthContext } from "./auth-context.ts";
import type { AuthStatus } from "./auth-context.ts";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Ask the server who is logged in once, when the app starts.
  // Any failure (401, server down, unexpected response) counts as logged out.
  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setUser(user);
        setStatus("authenticated");
      })
      .catch(() => {
        setUser(null);
        setStatus("anonymous");
      });
  }, []);

  // Errors are not caught here, so the login form can show them.
  async function login(body: LoginRequest) {
    const response = await loginRequest(body);
    setUser(response.user);
    setStatus("authenticated");
  }

  // Only clear the local state once the server has confirmed the logout.
  async function logout() {
    await logoutRequest();
    setUser(null);
    setStatus("anonymous");
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
