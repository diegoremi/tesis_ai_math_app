import type { Request, Response } from 'express';
import {
  createUserService,
  getUserById,
  updateUserService,
  updatePasswordService,
} from '../services/user.service.js';
import { verifyRecaptcha } from '../services/recaptcha.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const isRecaptchaEnabled = () => Boolean(process.env.RECAPTCHA_SECRET_KEY);

export const createUserController = async (req: Request, res: Response) => {
  try {
    if (isRecaptchaEnabled()) {
      const { recaptchaToken } = req.body;
      if (!recaptchaToken) {
        return res.status(400).json({ message: 'reCAPTCHA token is required.' });
      }

      const recaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaValid) {
        return res.status(400).json({ message: 'reCAPTCHA validation failed.' });
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
  } catch (error) {
    console.error('createUserController error:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Unexpected error creating user.' });
  }
};

export const updatePasswordController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    await updatePasswordService(userId, req.body);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating password' });
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting user profile' });
  }
};

export const updateUserController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const updatedUser = await updateUserService(userId, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
};
