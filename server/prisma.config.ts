import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ path: "../.env" });

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
