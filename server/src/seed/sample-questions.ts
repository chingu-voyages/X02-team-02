import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createQuestionSchema } from "@x02/shared";
import type { CreateQuestionInput } from "@x02/shared";

// Sample questions are original and based on the concepts in the Scrum Guide
// (https://scrumguides.org, CC BY-SA 4.0). They are not taken from any
// certification provider's assessments.

export type SeedQuestion = {
  id: string;
  seedId: string;
  question: CreateQuestionInput;
};

// A stable slug such as "scrum-001" always maps to the same UUID, so running the
// seed twice updates the same rows instead of inserting duplicates.
export function uuidFromSeedId(seedId: string): string {
  const hex = createHash("sha1").update(`x02-seed:${seedId}`).digest("hex");
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

// Reads the JSON file and checks every entry against the same schema the API
// uses. It collects all problems and throws once, so nothing is written to the
// database if even one entry is invalid.
export function loadSampleQuestions(): SeedQuestion[] {
  const file = new URL("./sample-questions.json", import.meta.url);
  const entries = JSON.parse(readFileSync(file, "utf8")) as Array<
    Record<string, unknown> & { seedId?: unknown }
  >;

  const problems: string[] = [];
  const seenSeedIds = new Set<string>();
  const questions: SeedQuestion[] = [];

  for (const entry of entries) {
    const { seedId, ...input } = entry;

    if (typeof seedId !== "string" || !seedId) {
      problems.push(`An entry is missing its seedId: ${JSON.stringify(entry).slice(0, 80)}`);
      continue;
    }

    if (seenSeedIds.has(seedId)) {
      problems.push(`Duplicate seedId: ${seedId}`);
      continue;
    }
    seenSeedIds.add(seedId);

    const result = createQuestionSchema.safeParse(input);

    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      problems.push(`${seedId} is invalid (${details})`);
      continue;
    }

    questions.push({
      id: uuidFromSeedId(seedId),
      seedId,
      question: result.data,
    });
  }

  if (problems.length > 0) {
    throw new Error(`Sample questions are invalid:\n- ${problems.join("\n- ")}`);
  }

  return questions;
}
