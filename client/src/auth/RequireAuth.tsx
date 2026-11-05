import { Navigate, Outlet } from "react-router";
import { useAuth } from "./useAuth.ts";

export function RequireAuth() {
  const { status } = useAuth();

  if (status === "loading") return <p>Loading...</p>;
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return <Outlet />;
}
