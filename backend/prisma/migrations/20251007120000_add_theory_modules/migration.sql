-- AlterEnum
ALTER TYPE "public"."EventType" ADD VALUE IF NOT EXISTS 'theory_start';
ALTER TYPE "public"."EventType" ADD VALUE IF NOT EXISTS 'theory_progress';
ALTER TYPE "public"."EventType" ADD VALUE IF NOT EXISTS 'theory_end';
ALTER TYPE "public"."EventType" ADD VALUE IF NOT EXISTS 'checkpoint_passed';

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SurveyTimepoint') THEN
    CREATE TYPE "public"."SurveyTimepoint" AS ENUM ('pre', 'post', 'exit', 'follow_up');
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "public"."Survey"
  ADD COLUMN IF NOT EXISTS "timepoint" "public"."SurveyTimepoint";

ALTER TABLE "public"."SurveySubmission"
  ADD COLUMN IF NOT EXISTS "timepoint" "public"."SurveyTimepoint" NOT NULL DEFAULT 'exit',
  ADD COLUMN IF NOT EXISTS "completed" BOOLEAN NOT NULL DEFAULT true;

UPDATE "public"."SurveySubmission" SET "timepoint" = 'exit' WHERE "timepoint" IS NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."TheoryModule" (
  "module_id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "module_index" INTEGER NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "content" JSONB NOT NULL,
  "version" VARCHAR(50),
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TheoryModule_user_id_module_index_key" UNIQUE ("user_id", "module_index")
);

CREATE INDEX IF NOT EXISTS "TheoryModule_user_id_idx" ON "public"."TheoryModule"("user_id");

ALTER TABLE "public"."TheoryModule"
  ADD CONSTRAINT "TheoryModule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."TheoryProgress" (
  "theory_progress_id" SERIAL PRIMARY KEY,
  "module_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "seconds_spent" INTEGER NOT NULL DEFAULT 0,
  "checkpoint_passed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TheoryProgress_module_id_user_id_key" UNIQUE ("module_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "TheoryProgress_user_id_idx" ON "public"."TheoryProgress"("user_id");

ALTER TABLE "public"."TheoryProgress"
  ADD CONSTRAINT "TheoryProgress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."TheoryModule"("module_id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TheoryProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
