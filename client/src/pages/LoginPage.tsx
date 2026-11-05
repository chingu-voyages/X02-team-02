import { Link } from "react-router";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm p-5">
      <Link to="/" className="mb-6 block text-center focus-ring">
        Logo
      </Link>
      <h1 className="text-xl font-semibold text-center mb-1">Log in</h1>
      <p className="text-center text-fg-muted mb-6">
        Welcome back. Keep practicing.
      </p>
      <LoginForm />
      <p className="mt-2 text-center text-sm text-fg-muted">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-accent-fg hover:underline focus-ring"
        >
          Register
        </Link>
      </p>
    </main>
  );
}
