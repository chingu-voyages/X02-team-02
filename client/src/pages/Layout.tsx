import { Outlet, NavLink, Link } from "react-router";

const adminLinks = [
  { label: "Dashboard", to: "#", end: true },
  { label: "Questions", to: "/admin/questions", end: false },
  { label: "Users", to: "#", end: false },
  { label: "Reports", to: "#", end: false },
  { label: "Logout", to: "#", end: false },
];

export default function Layout() {
  return (
    <div className="flex flex-col h-dvh">
      <header className="lg:mb-4 border border-gray-400">
        <div className="container mx-auto flex justify-between items-center p-2">
          <Link to="/">
            <h1>Logo</h1>
          </Link>

          <nav className="flex justify-between gap-3">
            {adminLinks.map((link) => (
              <NavLink key={link.label} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[750px] p-5 border border-blue-300">
        <Outlet />
      </main>
    </div>
  );
}
