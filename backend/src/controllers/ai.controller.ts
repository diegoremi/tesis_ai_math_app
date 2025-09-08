import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import axios from 'axios';

export const chatController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    const aiResponse = await axios.post('http://localhost:8001/chat', { message });
    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error('Error communicating with AI module:', error);
    res.status(500).json({ message: 'Error communicating with AI module' });
  }
};
