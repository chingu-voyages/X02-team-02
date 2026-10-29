import { Link } from "react-router";
import { useAuth } from "../auth/useAuth.ts";

export default function HomePage() {
  const { status } = useAuth();
  return (
    <main>
      <h1>Welcome</h1>
      <p>This is the home page.</p>
      <nav>
        <Link to="/login">Login</Link>
      </nav>
      <p>Status: {status}</p>
    </main>
  );
}
