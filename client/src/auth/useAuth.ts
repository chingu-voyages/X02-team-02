import { useContext } from "react";
import { AuthContext } from "./auth-context.ts";

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return value;
}