import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema, type RegisterInput } from "./schema";

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
  const onSubmit: SubmitHandler<RegisterInput> = (data) => console.log(data);

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
          type="confirmPassword"
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

      <button type="submit" disabled={isSubmitting}>
        Register
      </button>
    </form>
  );
}
