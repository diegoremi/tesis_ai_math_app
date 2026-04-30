import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  recordConsent,
  randomizeParticipants,
  getFeatureFlagsForUser,
  getRandomizationSummary,
} from '../services/study.service.js';
import {
  generateTheoryModule,
  updateTheoryProgress,
  submitTheoryCheckpoint,
  getStudyStatus,
} from '../services/theory.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const submitConsentController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { documentVersion, accepted } = req.body;
  if (!documentVersion || typeof accepted !== 'boolean') {
    throw new AppError('documentVersion and accepted (boolean) are required', 400);
  }

  const consent = await recordConsent(userId, { documentVersion, accepted });
  res.status(201).json(consent);
};

export const randomizeParticipantsController = async (req: AuthenticatedRequest, res: Response) => {
  const result = await randomizeParticipants(req.body);
  res.status(200).json(result);
};

export const getFeatureFlagsController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const flags = await getFeatureFlagsForUser(userId);
  res.status(200).json(flags);
};

export const getRandomizationSummaryController = async (req: AuthenticatedRequest, res: Response) => {
  const summary = await getRandomizationSummary();
  res.status(200).json(summary);
};

export const generateTheoryModuleController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { moduleIndex } = req.body ?? {};
  if (moduleIndex !== undefined && (!Number.isInteger(moduleIndex) || moduleIndex < 0)) {
    throw new AppError('moduleIndex must be a non-negative integer', 400);
  }

  const module = await generateTheoryModule(userId, req.body ?? {});
  res.status(200).json(module);
};

export const recordTheoryProgressController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { moduleId, progress } = req.body ?? {};
  if (!moduleId || typeof moduleId !== 'number') {
    throw new AppError('moduleId (number) is required', 400);
  }
  if (progress === undefined || typeof progress !== 'number' || progress < 0 || progress > 1) {
    throw new AppError('progress must be a number between 0 and 1', 400);
  }

  const progressRecord = await updateTheoryProgress(userId, req.body ?? {});
  res.status(200).json(progressRecord);
};

export const submitTheoryCheckpointController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { moduleId, answers } = req.body ?? {};
  if (!moduleId || typeof moduleId !== 'number') {
    throw new AppError('moduleId (number) is required', 400);
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new AppError('answers must be a non-empty array', 400);
  }

  const result = await submitTheoryCheckpoint(userId, req.body ?? {});
  res.status(200).json(result);
};

export const getStudyStatusController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }
  const status = await getStudyStatus(userId);
  res.status(200).json(status);
};
