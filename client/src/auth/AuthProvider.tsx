import type { ReactNode } from "react";
import { AuthContext } from "./auth-context.ts";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, status: "anonymous" }}>
      {children}
    </AuthContext.Provider>
  );
}