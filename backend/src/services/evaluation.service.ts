
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAssessment = async (userId: number, assessmentData: any) => {
  const { assessment_type, total_score } = assessmentData;
  const newAssessment = await prisma.assessment.create({
    data: {
      user_id: userId,
      assessment_type,
      total_score,
    },
  });
  return newAssessment;
};

export const getAssessmentsByUserId = async (userId: number) => {
  const assessments = await prisma.assessment.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return assessments;
};

export const getAssessmentById = async (assessmentId: number) => {
  const assessment = await prisma.assessment.findUnique({
    where: { assessment_id: assessmentId },
  });
  return assessment;
};

export const updateAssessment = async (assessmentId: number, assessmentData: any) => {
  const updatedAssessment = await prisma.assessment.update({
    where: { assessment_id: assessmentId },
    data: assessmentData,
  });
  return updatedAssessment;
};

export const deleteAssessment = async (assessmentId: number) => {
  const deletedAssessment = await prisma.assessment.delete({
    where: { assessment_id: assessmentId },
  });
  return deletedAssessment;
};
