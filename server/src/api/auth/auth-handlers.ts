import type { Request, Response } from "express";
import { hashPassword, verifyPassword } from "./password.js";
import { prisma } from "../../db/prisma.js";
import { createSession } from "./session.js";
import { setSessionCookie } from "./session-cookie.js";

const INVALID_CREDENTIALS = {
  error: "Invalid email or password",
};

export async function login(
  req: Request,
  res: Response,
): Promise<void> {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    res.status(400).json({
      error: "Email and password are required.",
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      res.status(401).json(INVALID_CREDENTIALS);
      return;
    }

    const passwordIsValid = await verifyPassword(
      user.passwordHash,
      password,
    );

    if (!passwordIsValid) {
      res.status(401).json(INVALID_CREDENTIALS);
      return;
    }

    const session = await createSession(user.id);

    setSessionCookie(res, session);

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("Login failed:", error);

    res.status(500).json({
      error: "Unable to log in.",
    });
  }
}

export async function register(
  req: Request,
  res: Response,
): Promise<void> {
  const { username, email, password } = req.body ?? {};

  const fieldErrors: { field: string; message: string }[] = [];

  // Required fields
  if (typeof username !== "string" || !username.trim()) {
    fieldErrors.push({
      field: "username",
      message: "Username is required.",
    });
  }

  if (typeof email !== "string" || !email.trim()) {
    fieldErrors.push({
      field: "email",
      message: "Email is required.",
    });
  }

  if (typeof password !== "string" || !password) {
    fieldErrors.push({
      field: "password",
      message: "Password is required.",
    });
  }

  if (fieldErrors.length > 0) {
    res.status(400).json({
      error: "Validation failed.",
      fieldErrors,
    });
    return;
  }

  const normalizedUsername = username.trim().normalize("NFC");
  const normalizedEmail = email.trim().toLowerCase();

  // Username validation
  if (normalizedUsername.length > 50) {
    fieldErrors.push({
      field: "username",
      message: "Username must not exceed 50 characters.",
    });
  }

  // Email validation
  if (normalizedEmail.length > 255) {
    fieldErrors.push({
      field: "email",
      message: "Email must not exceed 255 characters.",
    });
  }

  if (
    /\s/.test(normalizedEmail) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    fieldErrors.push({
      field: "email",
      message: "Email must be a valid email address.",
    });
  }

  // Password validation
  if (password.length < 8) {
    fieldErrors.push({
      field: "password",
      message: "Password must be at least 8 characters.",
    });
  }

  if (fieldErrors.length > 0) {
    res.status(400).json({
      error: "Validation failed.",
      fieldErrors,
    });
    return;
  }

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
