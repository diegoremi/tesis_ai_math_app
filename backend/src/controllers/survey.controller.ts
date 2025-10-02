import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createSurvey, listSurveyItems } from '../services/survey.service.js';
import type { SurveyInstrument } from '@prisma/client';

export const submitSurveyController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    if (!req.body.instrument) {
      return res.status(400).json({ message: 'instrument is required' });
    }
    const submission = await createSurvey(userId, req.body);
    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting survey' });
  }
};

export const getSurveyItemsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instrument = (req.query.instrument as string | undefined) ?? 'satisfaccion';
    const version = (req.query.version as string | undefined) ?? 'v1';
    const items = await listSurveyItems(instrument as SurveyInstrument, version);
    res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching survey items' });
  }
};
