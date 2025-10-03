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

export const getRandomizationSummaryController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await getRandomizationSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('getRandomizationSummaryController', error);
    res.status(500).json({ message: 'Error fetching randomization summary' });
  }
};

export const generateTheoryModuleController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const module = await generateTheoryModule(userId, req.body ?? {});
    res.status(200).json(module);
  } catch (error) {
    console.error('generateTheoryModuleController', error);
    res.status(500).json({ message: 'Error generating theory module' });
  }
};

export const recordTheoryProgressController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const progress = await updateTheoryProgress(userId, req.body ?? {});
    res.status(200).json(progress);
  } catch (error) {
    console.error('recordTheoryProgressController', error);
    res.status(500).json({ message: 'Error recording theory progress' });
  }
};

export const submitTheoryCheckpointController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const result = await submitTheoryCheckpoint(userId, req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    console.error('submitTheoryCheckpointController', error);
    res.status(500).json({ message: 'Error validating theory checkpoint' });
  }
};

export const getStudyStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const status = await getStudyStatus(userId);
    res.status(200).json(status);
  } catch (error) {
    console.error('getStudyStatusController', error);
    res.status(500).json({ message: 'Error fetching study status' });
  }
};
