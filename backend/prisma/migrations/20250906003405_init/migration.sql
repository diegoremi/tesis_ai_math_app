-- CreateEnum
CREATE TYPE "public"."EducationLevel" AS ENUM ('high_school', 'university', 'other');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('student', 'facilitator', 'admin');

-- CreateEnum
CREATE TYPE "public"."Device" AS ENUM ('PC', 'mobile', 'tablet');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('arithmetic', 'algebra', 'problems', 'statistics');

-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('basic', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('completed', 'pending');

-- CreateEnum
CREATE TYPE "public"."AssessmentType" AS ENUM ('pretest', 'posttest');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('suggestion', 'explanation', 'positive');

-- CreateEnum
CREATE TYPE "public"."InternetConnection" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "public"."User" (
    "user_id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "age" INTEGER NOT NULL,
    "education_level" "public"."EducationLevel",
    "goal" VARCHAR(150),
    "role" "public"."Role" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "total_time_seconds" INTEGER,
    "device" "public"."Device",

    CONSTRAINT "Session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "activity_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity_type" "public"."ActivityType" NOT NULL,
    "difficulty_level" "public"."DifficultyLevel" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "public"."Assessment" (
    "assessment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assessment_type" "public"."AssessmentType" NOT NULL,
    "total_score" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("assessment_id")
);

-- CreateTable
CREATE TABLE "public"."Survey" (
    "survey_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "perceived_utility" SMALLINT,
    "ease_of_use" SMALLINT,
    "motivation" SMALLINT,
    "autonomy" SMALLINT,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("survey_id")
);

-- CreateTable
CREATE TABLE "public"."AIFeedback" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity_id" INTEGER,
    "ai_message" TEXT NOT NULL,
    "message_type" "public"."MessageType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "public"."Infrastructure" (
    "access_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device" "public"."Device" NOT NULL,
    "internet_connection" "public"."InternetConnection" NOT NULL,
    "observations" TEXT,

    CONSTRAINT "Infrastructure_pkey" PRIMARY KEY ("access_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "public"."Session"("user_id");

-- CreateIndex
CREATE INDEX "Activity_user_id_idx" ON "public"."Activity"("user_id");

-- CreateIndex
CREATE INDEX "Assessment_user_id_idx" ON "public"."Assessment"("user_id");

-- CreateIndex
CREATE INDEX "Survey_user_id_idx" ON "public"."Survey"("user_id");

-- CreateIndex
CREATE INDEX "AIFeedback_user_id_idx" ON "public"."AIFeedback"("user_id");

-- CreateIndex
CREATE INDEX "AIFeedback_activity_id_idx" ON "public"."AIFeedback"("activity_id");

-- CreateIndex
CREATE INDEX "Infrastructure_user_id_idx" ON "public"."Infrastructure"("user_id");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Survey" ADD CONSTRAINT "Survey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIFeedback" ADD CONSTRAINT "AIFeedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIFeedback" ADD CONSTRAINT "AIFeedback_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("activity_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
