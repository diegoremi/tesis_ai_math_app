import type { Request, Response } from 'express';
import { getAnalytics, getParticipantProgress } from '../services/analytics.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAnalyticsController = async (_req: Request, res: Response) => {
  const analytics = await getAnalytics();
  res.status(200).json(analytics);
};

export const getParticipantProgressController = async (_req: Request, res: Response) => {
  const progress = await getParticipantProgress();
  res.status(200).json(progress);
};
