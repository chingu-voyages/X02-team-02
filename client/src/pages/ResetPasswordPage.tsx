import { Link, useSearchParams } from "react-router";
import ResetPasswordForm from "../components/ResetPasswordForm.tsx";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <main className="mx-auto w-full max-w-sm p-5">
      <Link to="/" className="mb-6 block text-center focus-ring">
        Logo
      </Link>

      <h1 className="mb-1 text-center text-xl font-semibold">
        Reset your password
      </h1>

      {!token ? (
        <div className="space-y-4 text-center">
          <p role="alert" className="text-sm text-danger-fg">
            This password reset link is invalid or missing.
          </p>
          <Link
            to="/forgot-password"
            className="text-accent-fg hover:underline focus-ring"
          >
            Request another reset link
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-center text-fg-muted">
            Choose a new password for your account.
          </p>
          <ResetPasswordForm token={token} />
        </>
      )}
    </main>
  );
}
