import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// server/src/db/prisma.ts -> server/src/db -> server/src -> server -> repository root
dotenv.config({
  path: path.resolve(currentDir, "../../../.env"),
});

const requiredEnv = [
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_DB",
] as const;

const missingEnv = requiredEnv.filter(
  (key) => !process.env[key],
);

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(", ")}`,
  );
}

const connectionString = [
  `postgresql://${encodeURIComponent(process.env.POSTGRES_USER!)}`,
  `:${encodeURIComponent(process.env.POSTGRES_PASSWORD!)}`,
  `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`,
  `/${encodeURIComponent(process.env.POSTGRES_DB!)}`,
].join("");

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
