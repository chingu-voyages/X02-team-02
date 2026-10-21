import type { Request, Response } from "express";
import { hashPassword } from "./password.js";
import { prisma } from "../../db/prisma.js";

export async function register(
  req: Request,
  res: Response,
): Promise<void> {
  const { username, email, password } = req.body ?? {};

  const fieldErrors = [];

  if (typeof username !== "string" || !username.trim()) {
    fieldErrors.push({ field: "username", message: "Username is required." });
  }
  if (typeof email !== "string" || !email.trim()) {
    fieldErrors.push({ field: "email", message: "Email is required." });
  }
  if (typeof password !== "string" || !password) {
    fieldErrors.push({ field: "password", message: "Password is required." });
  }

  if (fieldErrors.length > 0) {
    res.status(400).json({
      error: "Validation failed.",
      fieldErrors,
    });
    return;
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    res.status(201).json({ user });

  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const meta = "meta" in error ? error.meta : undefined;
      const target =
        typeof meta === "object" && meta !== null && "target" in meta
          ? String(meta.target)
          : "";

      if (target.includes("email")) {
        res.status(409).json({
          error: "An account with this email already exists.",
        });
        return;
      }

      if (target.includes("username")) {
        res.status(409).json({
          error: "An account with this username already exists.",
        });
        return;
      }

      res.status(409).json({
        error: "An account with this email or username already exists.",
      });
      return;
    }

    console.error("Account registration failed:", error);

    res.status(500).json({
      error: "Unable to register account.",
    });
  }
}
