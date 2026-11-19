import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "../schemas/passwordResetSchema.ts";
import { requestPasswordReset } from "../api/auth.ts";
import { ApiError } from "../api/client.ts";

export default function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<ForgotPasswordInput> = async (data) => {
    try {
      await requestPasswordReset(data.email);
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
          If an account exists for that email, a password reset link will be
          sent.
        </p>
        <p className="text-sm text-fg-muted">
          Check your inbox and follow the instructions in the email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          type="email"
          id="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          className="field focus-ring"
          placeholder="example@domain.com"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.email.message}
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
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
