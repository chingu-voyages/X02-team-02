import type { UserRole } from "@x02/shared";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "./useAuth.ts";

type RequireRoleProps = {
  allowedRoles: UserRole[];
};

export function RequireRole({
  allowedRoles,
}: RequireRoleProps) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  // Fail closed if the user or their role is unavailable.
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
