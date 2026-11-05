import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma.js";
import { hashPassword } from "../api/auth/password.js";
import { loadSampleQuestions } from "./sample-questions.js";

// A dedicated author for seeded questions. Nobody knows its password (a random
// one is hashed and thrown away), so this account can never be logged into.
// The .invalid domain is reserved and can never receive email.
const SEED_AUTHOR = {
  username: "seed-author",
  email: "seed-author@seed.invalid",
};

async function main() {
  // Validate every entry first. If anything is wrong this throws, and nothing
  // is written to the database.
  const questions = loadSampleQuestions();

  const author = await prisma.user.upsert({
    where: { email: SEED_AUTHOR.email },
    update: {},
    create: {
      ...SEED_AUTHOR,
      passwordHash: await hashPassword(randomBytes(32).toString("hex")),
      role: "QUESTION_MANAGER",
    },
    select: { id: true },
  });

  const existing = await prisma.question.findMany({
    where: { id: { in: questions.map((q) => q.id) } },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((q) => q.id));

  const now = new Date();

  // Upsert by the fixed ID so a second run updates rather than duplicates.
  // The update branch leaves reviewStatus alone, so a seeded question that
  // someone later flagged stays flagged.
  await prisma.$transaction(
    questions.map(({ id, question }) =>
      prisma.question.upsert({
        where: { id },
        create: {
          id,
          answerType: question.answerType,
          content: question.content,
          answerKey: question.answerKey,
          category: question.category,
          difficulty: question.difficulty,
          reviewStatus: "APPROVED",
          reviewedAt: now,
          authorId: author.id,
        },
        update: {
          answerType: question.answerType,
          content: question.content,
          answerKey: question.answerKey,
          category: question.category,
          difficulty: question.difficulty,
        },
      }),
    ),
  );

  const created = questions.filter((q) => !existingIds.has(q.id)).length;

  console.log(
    `Seeded ${questions.length} sample questions (${created} new, ${questions.length - created} updated).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
