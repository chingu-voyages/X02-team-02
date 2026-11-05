import { Link } from "react-router";
import RegisterForm from "../components/RegisterForm.tsx";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-sm p-5">
      <Link to="/" className="mb-6 block text-center focus-ring">
        Logo
      </Link>
      <h1 className="text-xl font-semibold text-center mb-1">Register</h1>
      <p className="text-center text-fg-muted mb-6">
        Sign up to start practicing.
      </p>
      <RegisterForm />
      <p className="mt-2 text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-accent-fg hover:underline focus-ring">
          Log in
        </Link>
      </p>
    </main>
  );
}
