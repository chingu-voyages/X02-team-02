import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { hashPassword } from "../api/auth/password.js";
import { prisma } from "../db/prisma.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// server/src/seed/seed-admin.ts -> server/src/seed -> server/src -> server -> repository root
dotenv.config({
  path: path.resolve(currentDir, "../../../.env"),
});

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must both be set in the root .env file.",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const username = email.split("@")[0].normalize("NFC");

  if (!username || username.length > 50) {
    throw new Error(
      "The local part of ADMIN_EMAIL must produce a username of 1–50 characters.",
    );
  }

  return { email, password, username };
}

export async function createFirstAdmin() {
  const { email, password, username } = getAdminCredentials();
  const passwordHash = await hashPassword(password);

  // Serializable isolation prevents concurrent seed runs from creating
  // multiple first-admin accounts.
  const result = await prisma.$transaction(
    async (tx) => {
      const existingAdmin = await tx.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (existingAdmin) {
        return "skipped";
      }

      const existingEmail = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingEmail) {
        throw new Error(
          "ADMIN_EMAIL already belongs to an existing account. Choose an unused email address.",
        );
      }

      const existingUsername = await tx.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (existingUsername) {
        throw new Error(
          "The username derived from ADMIN_EMAIL is already taken. Use an email with a different local part.",
        );
      }

      await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });

      return "created";
    },
    { isolationLevel: "Serializable" },
  );

  if (result === "created") {
    console.log("First admin account created successfully.");
  } else {
    console.log("An admin account already exists. No changes made.");
  }
}

createFirstAdmin()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Admin seeding failed.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
