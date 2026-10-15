import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// server/prisma.config.ts -> server -> repository root
dotenv.config({
  path: path.resolve(currentDir, "../.env"),
});

const databaseUrl = [
  `postgresql://${encodeURIComponent(env("POSTGRES_USER"))}`,
  `:${encodeURIComponent(env("POSTGRES_PASSWORD"))}`,
  `@${env("POSTGRES_HOST")}:${env("POSTGRES_PORT")}`,
  `/${encodeURIComponent(env("POSTGRES_DB"))}`,
].join("");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
