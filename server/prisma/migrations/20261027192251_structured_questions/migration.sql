/*
  Warnings:

  - You are about to drop the column `answer` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `questions` table. All the data in the column will be lost.
  - Added the required column `answer_key` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "question_review_status" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_author_id_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "answer",
DROP COLUMN "question",
ADD COLUMN     "answer_key" JSONB NOT NULL,
ADD COLUMN     "content" JSONB NOT NULL,
ADD COLUMN     "review_status" "question_review_status" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_id" UUID;

-- CreateIndex
CREATE INDEX "questions_review_status_category_idx" ON "questions"("review_status", "category");

-- CreateIndex
CREATE INDEX "questions_reviewed_by_id_idx" ON "questions"("reviewed_by_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
