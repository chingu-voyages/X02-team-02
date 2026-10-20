import { createContext } from "react";
import type { User } from "@x02/shared";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
};

export const AuthContext = createContext<AuthContextValue | null>(null);