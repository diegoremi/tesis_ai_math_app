
import { PrismaClient, AssessmentType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface AssessmentResponseInput {
  item_id: number;
  answer?: string | null;
  is_correct?: boolean | null;
}

interface AssessmentPayload {
  assessment_type: AssessmentType | string;
  test_version?: string;
  total_score?: number | string;
  started_at?: string | Date;
  finished_at?: string | Date;
  responses?: AssessmentResponseInput[];
}

export const createAssessment = async (userId: number, assessmentData: AssessmentPayload) => {
  const {
    assessment_type,
    test_version = 'v1',
    total_score,
    started_at,
    finished_at,
    responses = [],
  } = assessmentData;

  const totalScoreInt =
    total_score === undefined || total_score === null
      ? null
      : Number.parseInt(total_score as string, 10);

  const assessmentCreateInput: Prisma.AssessmentCreateInput = {
    user: {
      connect: { user_id: userId },
    },
    assessment_type: assessment_type as AssessmentType,
    test_version,
    total_score: Number.isNaN(totalScoreInt) ? null : totalScoreInt,
    started_at: started_at ? new Date(started_at) : null,
    finished_at: finished_at ? new Date(finished_at) : null,
  };

  if (responses.length > 0) {
    assessmentCreateInput.responses = {
      create: responses.map(response => ({
        item: { connect: { item_id: response.item_id } },
        answer: response.answer ?? null,
        is_correct: response.is_correct ?? null,
      })),
    };
  }

  const newAssessment = await prisma.assessment.create({
    data: assessmentCreateInput,
    include: {
      responses: true,
    },
  });

  return newAssessment;
};

export const getAssessmentsByUserId = async (userId: number) => {
  const assessments = await prisma.assessment.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      responses: {
        orderBy: { response_id: 'asc' },
      },
    },
  });
  return assessments;
};

export const getAssessmentById = async (assessmentId: number) => {
  const assessment = await prisma.assessment.findUnique({
    where: { assessment_id: assessmentId },
    include: {
      responses: {
        orderBy: { response_id: 'asc' },
      },
    },
  });
  return assessment;
};

export const updateAssessment = async (assessmentId: number, assessmentData: AssessmentPayload) => {
  const {
    total_score,
    test_version,
    started_at,
    finished_at,
  } = assessmentData;

  const totalScoreInt =
    total_score === undefined || total_score === null
      ? null
      : Number.parseInt(total_score as string, 10);

  const updateData: Prisma.AssessmentUpdateInput = {};

  if (test_version !== undefined) {
    updateData.test_version = test_version;
  }

  if (total_score !== undefined) {
    updateData.total_score = Number.isNaN(totalScoreInt) ? null : totalScoreInt;
  }

  if (started_at !== undefined) {
    updateData.started_at = started_at ? new Date(started_at) : null;
  }

  if (finished_at !== undefined) {
    updateData.finished_at = finished_at ? new Date(finished_at) : null;
  }

  const updatedAssessment = await prisma.assessment.update({
    where: { assessment_id: assessmentId },
    data: updateData,
    include: {
      responses: true,
    },
  });
  return updatedAssessment;
};

export const deleteAssessment = async (assessmentId: number) => {
  const deletedAssessment = await prisma.assessment.delete({
    where: { assessment_id: assessmentId },
  });
  return deletedAssessment;
};

export const listAssessmentItems = async (assessmentType: AssessmentType | string, version?: string) => {
  const inferredVersion = version ?? (assessmentType === 'posttest' ? 'exit_v1' : 'v1');
  const items = await prisma.assessmentItem.findMany({
    where: { test_version: inferredVersion },
    orderBy: { item_id: 'asc' },
  });
  return items;
};
