import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(64, "Password must not exceed 64 characters.")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

export const registerFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Username must be at least 1 character.")
      .max(50, "Username must not exceed 50 characters."),
    email: z
      .string()
      .trim()
      .max(255, "Email cannot exceed 255 characters.")
      .pipe(z.email("Enter a valid email address.")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerFormSchema>;
