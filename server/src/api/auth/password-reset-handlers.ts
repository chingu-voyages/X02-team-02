import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { hashPassword } from "./password.js";
import { sendPasswordResetEmail } from "../../services/email-service.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// server/src/api/auth/password-reset-handlers.ts -> server/src/api/auth -> server/src/api -> server/src -> sever -> repository root
dotenv.config({
  path: path.resolve(currentDir, "../../../../.env"),
});

const RESET_TOKEN_EXPIRATION_MS = 30 * 60 * 1000;

const FORGOT_PASSWORD_RESPONSE = {
  message:
    "If an account exists for that email, a password reset link will be sent.",
};

const INVALID_RESET_TOKEN_RESPONSE = {
  error: "This password reset link is invalid or has expired.",
};

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length <= 255 &&
    !/\s/.test(email) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function createResetUrl(token: string): string {
  const appUrl = process.env.APP_URL?.trim();

  if (!appUrl) {
    throw new Error("Missing required environment variable: APP_URL");
  }

  const url = new URL("/reset-password", appUrl);
  url.searchParams.set("token", token);

  return url.toString();
}

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!isValidEmail(email)) {
    res.status(400).json({
      error: "A valid email address is required.",
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (user && user.status === "ACTIVE") {
      // The original token is sent by email. Only its hash is stored.
      const token = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(
        Date.now() + RESET_TOKEN_EXPIRATION_MS,
      );

      // Invalidate previously issued reset links for this account.
      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({
          where: { userId: user.id },
        });

        await tx.passwordResetToken.create({
          data: {
            tokenHash,
            userId: user.id,
            expiresAt,
          },
        });
      });

      try {
        await sendPasswordResetEmail(
          user.email,
          createResetUrl(token),
        );
      } catch (error: unknown) {
        // Do not leave a usable token behind if delivery fails.
        await prisma.passwordResetToken.deleteMany({
          where: { tokenHash },
        });

        throw error;
      }
    }
  } catch (error: unknown) {
    // Do not disclose whether the account exists or whether delivery failed.
    console.error("Password reset request failed:", error);
  }

  res.status(202).json(FORGOT_PASSWORD_RESPONSE);
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { token, password } = req.body ?? {};

  if (typeof token !== "string" || !token) {
    res.status(400).json(INVALID_RESET_TOKEN_RESPONSE);
    return;
  }

  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({
      error: "Password must be at least 8 characters.",
    });
    return;
  }

  const tokenHash = hashResetToken(token);
  const now = new Date();

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.expiresAt <= now ||
      resetToken.user.status !== "ACTIVE"
    ) {
      res.status(400).json(INVALID_RESET_TOKEN_RESPONSE);
      return;
    }

    const newPasswordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      // Atomically consume the token. If another request has already
      // consumed it, this conditional delete returns count = 0.
      const consumedToken = await tx.passwordResetToken.deleteMany({
        where: {
          id: resetToken.id,
          tokenHash,
          expiresAt: {
            gt: now,
          },
        },
      });

      if (consumedToken.count !== 1) {
        throw new Error("PASSWORD_RESET_TOKEN_ALREADY_USED");
      }

      const updatedUser = await tx.user.updateMany({
        where: {
          id: resetToken.userId,
          status: "ACTIVE",
        },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      if (updatedUser.count !== 1) {
        throw new Error("PASSWORD_RESET_ACCOUNT_UNAVAILABLE");
      }

      // End all existing sessions after a successful password reset.
      await tx.session.deleteMany({
        where: {
          userId: resetToken.userId,
        },
      });

      // Invalidate any other outstanding reset links for this account.
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
        },
      });
    });

    res.status(200).json({
      message: "Your password has been reset. Please log in.",
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === "PASSWORD_RESET_TOKEN_ALREADY_USED" ||
        error.message === "PASSWORD_RESET_ACCOUNT_UNAVAILABLE")
    ) {
      res.status(400).json(INVALID_RESET_TOKEN_RESPONSE);
      return;
    }

    console.error("Password reset failed:", error);

    res.status(500).json({
      error: "Unable to reset password.",
    });
  }
}
