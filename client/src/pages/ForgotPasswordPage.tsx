import { Link } from "react-router";
import ForgotPasswordForm from "../components/ForgotPasswordForm.tsx";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-sm p-5">
      <Link to="/" className="mb-6 block text-center focus-ring">
        Logo
      </Link>

      <h1 className="mb-1 text-center text-xl font-semibold">
        Forgot password?
      </h1>

      <p className="mb-6 text-center text-fg-muted">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      <ForgotPasswordForm />

      <p className="mt-4 text-center text-sm text-fg-muted">
        Remember your password?{" "}
        <Link to="/login" className="text-accent-fg hover:underline focus-ring">
          Log in
        </Link>
      </p>
    </main>
  );
}
