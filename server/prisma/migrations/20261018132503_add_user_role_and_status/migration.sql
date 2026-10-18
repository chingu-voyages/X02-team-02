-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('LEARNER', 'QUESTION_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'LEARNER',
ADD COLUMN     "status" "account_status" NOT NULL DEFAULT 'ACTIVE';
