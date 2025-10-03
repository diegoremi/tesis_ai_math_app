-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PracticeItemStatus') THEN
    CREATE TYPE "public"."PracticeItemStatus" AS ENUM ('generated', 'completed', 'failed');
  END IF;
END
$$;

-- CreateTable PracticeGenerated
CREATE TABLE IF NOT EXISTS "public"."PracticeGenerated" (
  "practice_generated_id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "session_id" VARCHAR(100) NOT NULL,
  "topic" VARCHAR(50),
  "difficulty" VARCHAR(20),
  "item_json" JSONB NOT NULL,
  "status" "public"."PracticeItemStatus" NOT NULL DEFAULT 'generated',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumed_at" TIMESTAMP(3),
  CONSTRAINT "PracticeGenerated_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PracticeGenerated_user_id_status_idx" ON "public"."PracticeGenerated"("user_id", "status");
CREATE INDEX IF NOT EXISTS "PracticeGenerated_session_id_idx" ON "public"."PracticeGenerated"("session_id");

-- CreateTable PracticeAttempt
CREATE TABLE IF NOT EXISTS "public"."PracticeAttempt" (
  "practice_attempt_id" SERIAL PRIMARY KEY,
  "practice_generated_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "user_answer" VARCHAR(10),
  "correct" BOOLEAN NOT NULL DEFAULT false,
  "explanation" TEXT,
  "domain" VARCHAR(50),
  "competency" VARCHAR(50),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PracticeAttempt_generated_fkey" FOREIGN KEY ("practice_generated_id") REFERENCES "public"."PracticeGenerated"("practice_generated_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PracticeAttempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PracticeAttempt_user_id_idx" ON "public"."PracticeAttempt"("user_id");
CREATE INDEX IF NOT EXISTS "PracticeAttempt_generated_idx" ON "public"."PracticeAttempt"("practice_generated_id");
