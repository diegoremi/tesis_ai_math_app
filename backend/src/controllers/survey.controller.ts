import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createSurvey, listSurveyItems } from '../services/survey.service.js';
import type { SurveyInstrument } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const VALID_SURVEY_INSTRUMENTS = ['tam', 'motivacion', 'autonomia', 'satisfaccion'];

export const submitSurveyController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }
  const { instrument } = req.body;
  if (!instrument) {
    throw new AppError('instrument is required', 400);
  }
  if (!VALID_SURVEY_INSTRUMENTS.includes(instrument)) {
    throw new AppError(`Invalid instrument. Must be one of: ${VALID_SURVEY_INSTRUMENTS.join(', ')}`, 400);
  }
  const submission = await createSurvey(userId, req.body);
  res.status(201).json(submission);
};

export const getSurveyItemsController = async (req: AuthenticatedRequest, res: Response) => {
  const instrument = (req.query.instrument as string | undefined) ?? 'tam';
  const version = (req.query.version as string | undefined) ?? 'v1';

  if (!VALID_SURVEY_INSTRUMENTS.includes(instrument)) {
    throw new AppError(`Invalid instrument. Must be one of: ${VALID_SURVEY_INSTRUMENTS.join(', ')}`, 400);
  }

  const items = await listSurveyItems(instrument as SurveyInstrument, version);
  res.status(200).json({ items });
};
