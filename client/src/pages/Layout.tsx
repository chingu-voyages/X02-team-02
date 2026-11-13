import { Outlet, NavLink, Link, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../auth/useAuth.ts";

const adminLinks = [
  { label: "Dashboard", to: "#", end: true },
  { label: "Questions", to: "/admin/questions", end: false },
  { label: "Users", to: "#", end: false },
  { label: "Reports", to: "#", end: false },
];

const learnerLinks = [
  { label: "Exams", to: "/exams/categories", end: false },
  { label: "Journal", to: "#", end: false },
  { label: "Questions", to: "#", end: false },
];

export default function Layout() {
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      setLogoutError(null);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error(error);
      setLogoutError("Couldn't log out. Please try again.");
    }
  };

  const links = user?.role === "ADMIN" ? adminLinks : learnerLinks;

  return (
    <div className="flex flex-col h-dvh">
      <header className="lg:mb-4 border-b border-line">
        <div className="container mx-auto flex justify-between items-center p-2">
          <Link to="/">
            <h1>Logo</h1>
          </Link>

          <nav className="flex justify-between gap-3">
            {links.map((link) => (
              <NavLink key={link.label} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl p-5">
        {logoutError && (
          <p role="alert" className="mt-1 text-sm text-red-600 text-center">
            {logoutError}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
