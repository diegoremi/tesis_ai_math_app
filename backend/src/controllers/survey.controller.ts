import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createSurvey } from '../services/survey.service.js';

export const submitSurveyController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const newSurvey = await createSurvey(userId, req.body);
    res.status(201).json(newSurvey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting survey' });
  }
};
