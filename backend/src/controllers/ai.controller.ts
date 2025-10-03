import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import axios from 'axios';
import { getPracticeItemById } from '../services/planner.service.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';

export const chatController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/chat`, { message });
    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error('Error communicating with AI module:', error);
    res.status(500).json({ message: 'Error communicating with AI module' });
  }
};

export const hintController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exerciseId } = req.body;
    if (typeof exerciseId !== 'number') {
      return res.status(400).json({ message: 'exerciseId (number) is required' });
    }

    const item = await getPracticeItemById(exerciseId);
    if (!item) {
      return res.status(404).json({ message: 'Practice item not found for hint generation' });
    }

    const payload = {
      stem: item.stem,
      options: item.options,
      domain: item.domain,
      competency: item.competency,
    };

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/hint`, payload);
    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error('Error requesting AI hint:', error);
    res.status(500).json({ message: 'Error generating hint with AI service' });
  }
};
