import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { recordConsent, randomizeParticipants, getFeatureFlagsForUser } from '../services/study.service.js';

export const submitConsentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const consent = await recordConsent(userId, req.body);
    res.status(201).json(consent);
  } catch (error) {
    console.error('submitConsentController', error);
    res.status(500).json({ message: 'Error recording consent' });
  }
};

export const randomizeParticipantsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await randomizeParticipants(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('randomizeParticipantsController', error);
    res.status(500).json({ message: 'Error randomizing participants' });
  }
};

export const getFeatureFlagsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const flags = await getFeatureFlagsForUser(userId);
    res.status(200).json(flags);
  } catch (error) {
    console.error('getFeatureFlagsController', error);
    res.status(500).json({ message: 'Error retrieving feature flags' });
  }
};
