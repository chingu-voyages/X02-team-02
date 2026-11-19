import { z } from "zod";
import { passwordSchema } from "./authSchema.ts";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .max(255, "Email cannot exceed 255 characters")
    .pipe(z.email("Enter a valid email address")),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
