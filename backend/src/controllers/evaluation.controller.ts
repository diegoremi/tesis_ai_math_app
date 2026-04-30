import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createAssessment, getAssessmentsByUserId, getAssessmentById, updateAssessment, deleteAssessment, listAssessmentItems } from '../services/evaluation.service.js';
import { getStudyStatus } from '../services/theory.service.js';
import type { AssessmentType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

function validateIdParam(param: string | undefined): number {
  const id = Number.parseInt(param ?? '', 10);
  if (Number.isNaN(id)) {
    throw new AppError('Invalid ID parameter', 400);
  }
  return id;
}

export const createAssessmentController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { assessment_type } = req.body;
  if (assessment_type === 'posttest') {
    const studyStatus = await getStudyStatus(userId);
    if (!studyStatus.posttestUnlocked) {
      throw new AppError('Posttest is not unlocked yet. Complete required modules and checkpoints first.', 403);
    }
  }

  const newAssessment = await createAssessment(userId, req.body);
  res.status(201).json(newAssessment);
};

export const getAssessmentsController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }
  const assessments = await getAssessmentsByUserId(userId);
  res.status(200).json(assessments);
};

export const getAssessmentByIdController = async (req: AuthenticatedRequest, res: Response) => {
  const assessmentId = validateIdParam(req.params.id);
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }
  // Ensure the assessment belongs to the authenticated user
  if (assessment.user_id !== req.user?.userId) {
    throw new AppError('Unauthorized access to assessment', 403);
  }
  res.status(200).json(assessment);
};

export const updateAssessmentController = async (req: AuthenticatedRequest, res: Response) => {
  const assessmentId = validateIdParam(req.params.id);
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const existingAssessment = await getAssessmentById(assessmentId);
  if (!existingAssessment) {
    throw new AppError('Assessment not found', 404);
  }
  if (existingAssessment.user_id !== userId) {
    throw new AppError('Unauthorized to update this assessment', 403);
  }

  const updatedAssessment = await updateAssessment(assessmentId, req.body);
  res.status(200).json(updatedAssessment);
};

export const deleteAssessmentController = async (req: AuthenticatedRequest, res: Response) => {
  const assessmentId = validateIdParam(req.params.id);
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const existingAssessment = await getAssessmentById(assessmentId);
  if (!existingAssessment) {
    throw new AppError('Assessment not found', 404);
  }
  if (existingAssessment.user_id !== userId) {
    throw new AppError('Unauthorized to delete this assessment', 403);
  }

  await deleteAssessment(assessmentId);
  res.status(204).send();
};

export const getAssessmentItemsController = async (req: AuthenticatedRequest, res: Response) => {
  const assessmentType = (req.query.type as string | undefined) ?? 'pretest';
  const validTypes = ['pretest', 'posttest'];
  if (!validTypes.includes(assessmentType)) {
    throw new AppError('Invalid assessment type. Must be pretest or posttest', 400);
  }
  const version = req.query.version as string | undefined;
  const items = await listAssessmentItems(assessmentType as AssessmentType, version);
  res.status(200).json({ items });
};
