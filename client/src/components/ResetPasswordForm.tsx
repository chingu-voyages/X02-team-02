import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "../schemas/passwordResetSchema.ts";
import { resetPassword } from "../api/auth.ts";
import { ApiError } from "../api/client.ts";
import { Link } from "react-router";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<ResetPasswordInput> = async (data) => {
    try {
      await resetPassword(token, data.password);
      setSubmitted(true);
    } catch (error) {
      setError("root.server", {
        type: "server",
        message:
          error instanceof ApiError
            ? error.message
            : "Couldn't reach the server. Please try again.",
      });
    }
  };

  if (submitted) {
    return (
      <div role="status" className="space-y-3 text-center">
        <p className="text-sm text-fg">
          Your password has been reset successfully.
        </p>
        <Link to="/login" className="inline-block btn-primary focus-ring">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div>
        <label htmlFor="password" className="label">
          New password
        </label>
        <input
          type="password"
          id="password"
          autoComplete="new-password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
          className="field focus-ring"
        />
        {errors.password && (
          <p
            id="password-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirm new password
        </label>
        <input
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          {...register("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby="confirmPassword-error"
          className="field focus-ring"
        />
        {errors.confirmPassword && (
          <p
            id="confirmPassword-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer w-full btn-primary focus-ring"
      >
        {isSubmitting ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
