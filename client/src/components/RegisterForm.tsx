import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerFormSchema,
  type RegisterInput,
} from "../schemas/authSchema.ts";
import type { RegisterRequest } from "@x02/shared";
import { register as registerUser } from "../api/auth.ts";
import { ApiError } from "../api/client.ts";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth.ts";

const SERVER_FIELDS = ["username", "email", "password"];
type ServerField = "username" | "email" | "password";

function isServerField(name: string): name is ServerField {
  return SERVER_FIELDS.includes(name);
}

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerFormSchema),
    mode: "onTouched",
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit: SubmitHandler<RegisterInput> = async (data) => {
    const request: RegisterRequest = {
      username: data.username,
      email: data.email,
      password: data.password,
    };

    try {
      await registerUser(request);
      // TODO: set up login after register on BE, navigate to a different route later
      await login({ email: data.email, password: data.password });
      navigate("/admin/questions");
    } catch (error) {
      if (error instanceof ApiError) {
        // input field error
        if (error.fieldErrors.length > 0) {
          let hasHandledFieldError = false;
          for (const { field, message } of error.fieldErrors) {
            if (isServerField(field)) {
              setError(
                field,
                { type: "server", message },
                { shouldFocus: !hasHandledFieldError },
              );
              hasHandledFieldError = true;
            }
          }
          if (hasHandledFieldError) return;
        }

        // form-level error
        setError("root.server", {
          type: String(error.status),
          message: error.message,
        });

        return;
      }

      setError("root.server", {
        type: "network",
        message: "Couldn't reach the server. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          type="text"
          id="username"
          {...register("username")}
          aria-invalid={!!errors.username}
          aria-describedby="username-error"
          className="field focus-ring"
          placeholder="Your name"
        />
        {errors?.username && (
          <p
            id="username-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.username.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          type="email"
          id="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          className="field focus-ring"
          placeholder="example@domain.com"
        />
        {errors?.email && (
          <p
            id="email-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.email.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          type="password"
          id="password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
          className="field focus-ring"
        />
        {errors?.password && (
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
          Confirm password
        </label>
        <input
          type="Password"
          id="confirmPassword"
          {...register("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby="confirmPassword-error"
          className="field focus-ring"
        />
        {errors?.confirmPassword && (
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
        <p role="alert" className="mt-1 text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary focus-ring mt-3"
      >
        Register
      </button>
    </form>
  );
}
