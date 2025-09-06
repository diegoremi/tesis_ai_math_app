
import type { Request, Response } from 'express';
import { loginService } from '../services/auth.service.js';

export const loginController = async (req: Request, res: Response) => {
  try {
    const { token } = await loginService(req.body);
    res.status(200).json({ token });
  } catch (error) {
    if (error instanceof Error) {
        return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
