import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema, type LoginInput } from "../schemas/authSchema.ts";
import type { LoginRequest } from "@x02/shared";
import { ApiError } from "../api/client.ts";
import { useAuth } from "../auth/useAuth.ts";
import { useNavigate } from "react-router";

export default function LoginForm() {
  const { login, user } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
  });

  const navigate = useNavigate();

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    const request: LoginRequest = {
      email: data.email,
      password: data.password,
    };
    try {
      await login(request);
      // TODO: navigate to different route later
      if (user?.role === "LEARNER") {
        navigate("/");
      } else navigate("/admin/questions");
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        // form-level errors
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
        Login
      </button>
    </form>
  );
}
