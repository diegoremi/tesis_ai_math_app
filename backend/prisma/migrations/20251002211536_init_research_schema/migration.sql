-- CreateEnum
CREATE TYPE "public"."EducationLevel" AS ENUM ('high_school', 'university', 'other');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('student', 'facilitator', 'admin');

-- CreateEnum
CREATE TYPE "public"."Device" AS ENUM ('PC', 'mobile', 'tablet');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('arithmetic', 'algebra', 'problems', 'statistics', 'exercise', 'quiz', 'flashcard');

-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('basic', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('completed', 'pending', 'in_progress');

-- CreateEnum
CREATE TYPE "public"."AssessmentType" AS ENUM ('pretest', 'posttest');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('hint', 'explanation', 'motivation');

-- CreateEnum
CREATE TYPE "public"."InternetConnection" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "public"."MathLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "public"."AssignmentGroup" AS ENUM ('GE', 'GC');

-- CreateEnum
CREATE TYPE "public"."AssignmentMethod" AS ENUM ('azar', 'emparejamiento');

-- CreateEnum
CREATE TYPE "public"."SurveyInstrument" AS ENUM ('motivacion', 'autonomia', 'tam', 'satisfaccion');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('session_start', 'session_end', 'hint', 'correct', 'incorrect', 'streak', 'goal_met');

-- CreateEnum
CREATE TYPE "public"."PracticeType" AS ENUM ('exercise', 'quiz', 'flashcard');

-- CreateTable
CREATE TABLE "public"."User" (
    "user_id" SERIAL NOT NULL,
    "participant_code" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "age" INTEGER,
    "education_level" "public"."EducationLevel",
    "gender" "public"."Gender",
    "math_level" "public"."MathLevel",
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
    "duration_seconds" INTEGER,
    "domain" VARCHAR(100),
    "competency" VARCHAR(100),
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "public"."Assessment" (
    "assessment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assessment_type" "public"."AssessmentType" NOT NULL,
    "test_version" VARCHAR(50) NOT NULL DEFAULT 'v1',
    "total_score" INTEGER,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
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
    "prompt_hash" VARCHAR(128),
    "token_count" INTEGER,
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

-- CreateTable
CREATE TABLE "public"."Consent" (
    "consent_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "document_version" VARCHAR(50) NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("consent_id")
);

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "assignment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "group" "public"."AssignmentGroup" NOT NULL,
    "method" "public"."AssignmentMethod" NOT NULL,
    "seed" VARCHAR(50),
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "public"."FeatureFlag" (
    "feature_flag_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "chatbot" BOOLEAN NOT NULL DEFAULT false,
    "adaptativo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("feature_flag_id")
);

-- CreateTable
CREATE TABLE "public"."AssessmentItem" (
    "item_id" SERIAL NOT NULL,
    "test_version" VARCHAR(50) NOT NULL,
    "domain" VARCHAR(100),
    "competency" VARCHAR(100),
    "stem" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_key" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "public"."AssessmentResponse" (
    "response_id" SERIAL NOT NULL,
    "assessment_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "answer" VARCHAR(50),
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("response_id")
);

-- CreateTable
CREATE TABLE "public"."SurveyItem" (
    "survey_item_id" SERIAL NOT NULL,
    "instrument" "public"."SurveyInstrument" NOT NULL,
    "subscale" VARCHAR(100),
    "version" VARCHAR(50) NOT NULL,
    "prompt" TEXT NOT NULL,
    "sort_order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyItem_pkey" PRIMARY KEY ("survey_item_id")
);

-- CreateTable
CREATE TABLE "public"."SurveySubmission" (
    "survey_submission_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "instrument" "public"."SurveyInstrument" NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveySubmission_pkey" PRIMARY KEY ("survey_submission_id")
);

-- CreateTable
CREATE TABLE "public"."SurveyResponse" (
    "survey_response_id" SERIAL NOT NULL,
    "survey_submission_id" INTEGER NOT NULL,
    "survey_item_id" INTEGER NOT NULL,
    "value" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("survey_response_id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "event_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event_type" "public"."EventType" NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "public"."PracticeSummary" (
    "practice_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "practice_type" "public"."PracticeType" NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSummary_pkey" PRIMARY KEY ("practice_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_participant_code_key" ON "public"."User"("participant_code");

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

-- CreateIndex
CREATE INDEX "Consent_user_id_idx" ON "public"."Consent"("user_id");

-- CreateIndex
CREATE INDEX "Assignment_user_id_idx" ON "public"."Assignment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_user_id_key" ON "public"."FeatureFlag"("user_id");

-- CreateIndex
CREATE INDEX "AssessmentResponse_assessment_id_idx" ON "public"."AssessmentResponse"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentResponse_item_id_idx" ON "public"."AssessmentResponse"("item_id");

-- CreateIndex
CREATE INDEX "SurveySubmission_user_id_idx" ON "public"."SurveySubmission"("user_id");

-- CreateIndex
CREATE INDEX "SurveyResponse_survey_submission_id_idx" ON "public"."SurveyResponse"("survey_submission_id");

-- CreateIndex
CREATE INDEX "SurveyResponse_survey_item_id_idx" ON "public"."SurveyResponse"("survey_item_id");

-- CreateIndex
CREATE INDEX "Event_user_id_occurred_at_idx" ON "public"."Event"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "PracticeSummary_user_id_idx" ON "public"."PracticeSummary"("user_id");

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

-- AddForeignKey
ALTER TABLE "public"."Consent" ADD CONSTRAINT "Consent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureFlag" ADD CONSTRAINT "FeatureFlag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."Assessment"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."AssessmentItem"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveySubmission" ADD CONSTRAINT "SurveySubmission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_survey_submission_id_fkey" FOREIGN KEY ("survey_submission_id") REFERENCES "public"."SurveySubmission"("survey_submission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_survey_item_id_fkey" FOREIGN KEY ("survey_item_id") REFERENCES "public"."SurveyItem"("survey_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PracticeSummary" ADD CONSTRAINT "PracticeSummary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
