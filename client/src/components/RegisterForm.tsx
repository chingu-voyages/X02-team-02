import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema, type RegisterInput } from "../auth/schemas.ts";
import type { RegisterRequest } from "@x02/shared";
import { register as registerUser } from "../api/auth.ts";
import { ApiError } from "../api/client.ts";

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
  const onSubmit: SubmitHandler<RegisterInput> = async (data) => {
    const request: RegisterRequest = {
      username: data.username,
      email: data.email,
      password: data.password,
    };

    try {
      const result = await registerUser(request);
      // TODO: navigate after registration
      console.log(result);
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          {...register("username")}
          aria-invalid={!!errors.username}
          aria-describedby="username-error"
        />
        {errors?.username && (
          <p id="username-error" role="alert">
            {errors.username.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
        />
        {errors?.email && (
          <p id="email-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
        />
        {errors?.password && (
          <p id="password-error" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          type="Password"
          id="confirmPassword"
          {...register("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby="confirmPassword-error"
        />
        {errors?.confirmPassword && (
          <p id="confirmPassword-error" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        Register
      </button>
    </form>
  );
}
