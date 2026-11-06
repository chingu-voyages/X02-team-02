/*
  Warnings:

  - Added the required column `answer_type` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Made the column `category` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "question_answer_type" AS ENUM ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY');

-- AlterEnum
ALTER TYPE "question_review_status" ADD VALUE 'FLAGGED';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "answer_type" "question_answer_type" NOT NULL,
ADD COLUMN     "flagged_at" TIMESTAMP(3),
ADD COLUMN     "flagged_reason" TEXT,
ALTER COLUMN "category" SET NOT NULL;
