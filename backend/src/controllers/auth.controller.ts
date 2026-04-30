
import type { Request, Response } from 'express';
import { loginService } from '../services/auth.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const loginController = async (req: Request, res: Response) => {
  const { token } = await loginService(req.body);
  res.status(200).json({ token });
};
