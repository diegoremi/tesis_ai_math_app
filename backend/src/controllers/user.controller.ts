import type { Request, Response } from 'express';
import {
  createUserService,
  getUserById,
  updateUserService,
  updatePasswordService,
} from '../services/user.service.js';
import { verifyRecaptcha } from '../services/recaptcha.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/errorHandler.js';

const isRecaptchaEnabled = () => Boolean(process.env.RECAPTCHA_SECRET_KEY);

export const createUserController = async (req: Request, res: Response) => {
  if (isRecaptchaEnabled()) {
    const { recaptchaToken } = req.body;
    if (!recaptchaToken) {
      throw new AppError('reCAPTCHA token is required.', 400);
    }

    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
      throw new AppError('reCAPTCHA validation failed.', 400);
    }
    delete req.body.recaptchaToken;
  }

  const newUser = await createUserService(req.body);
  return res.status(201).json({
    message: 'User created successfully',
    user: {
      user_id: newUser.user_id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role: newUser.role,
      created_at: newUser.created_at,
    },
  });
};

export const updatePasswordController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  await updatePasswordService(userId, req.body);
  res.status(200).json({ message: 'Password updated successfully' });
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json(user);
};

export const updateUserController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const updatedUser = await updateUserService(userId, req.body);
  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json(updatedUser);
};
