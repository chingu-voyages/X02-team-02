-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "score" INTEGER,
    "category" VARCHAR(100) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_questions" (
    "id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "answer_type" "question_answer_type" NOT NULL,
    "answer_key" JSONB NOT NULL,
    "answer" JSONB,
    "is_correct" BOOLEAN,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,

    CONSTRAINT "attempt_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attempts_user_id_finished_at_idx" ON "attempts"("user_id", "finished_at");

-- CreateIndex
CREATE INDEX "attempt_questions_question_id_idx" ON "attempt_questions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_questions_attempt_id_position_key" ON "attempt_questions"("attempt_id", "position");

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
