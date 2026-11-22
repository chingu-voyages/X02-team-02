import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { User, UserRole } from "@x02/shared";
import { AuthContext } from "./auth-context.ts";
import type { AuthContextValue } from "./auth-context.ts";
import { RequireRole } from "./RequireRole.tsx";

function renderAdminRoute(
  role: UserRole | null,
  status: AuthContextValue["status"] = "authenticated",
) {
  const user: User | null = role
    ? {
        id: "user-1",
        username: "test-user",
        email: "test@example.com",
        role,
      }
    : null;

  const authValue: AuthContextValue = {
    user,
    status,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<RequireRole allowedRoles={["ADMIN"]} />}>
            <Route
              path="/admin"
              element={<p>Admin page</p>}
            />
          </Route>

          <Route path="/" element={<p>Home page</p>} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireRole", () => {
  it("renders the admin page for ADMIN", () => {
    renderAdminRoute("ADMIN");

    expect(screen.getByText("Admin page")).toBeInTheDocument();
  });

  it.each(["LEARNER", "QUESTION_MANAGER"] as const)(
    "redirects %s away from the admin page",
    (role) => {
      renderAdminRoute(role);

      expect(screen.queryByText("Admin page")).not.toBeInTheDocument();
      expect(screen.getByText("Home page")).toBeInTheDocument();
    },
  );

  it("redirects anonymous users to login", () => {
    renderAdminRoute(null, "anonymous");

    expect(screen.queryByText("Admin page")).not.toBeInTheDocument();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("shows a loading state while authentication is unresolved", () => {
    renderAdminRoute(null, "loading");

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Admin page")).not.toBeInTheDocument();
  });
});
