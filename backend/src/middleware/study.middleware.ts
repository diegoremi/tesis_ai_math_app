import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

export const requireConsent = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next(new AppError('Authentication required', 401));
  }

  const consent = await prisma.consent.findFirst({
    where: {
      user_id: userId,
      accepted: true,
    },
    orderBy: { accepted_at: 'desc' },
  });

  if (!consent) {
    return next(new AppError('Consent required. Please accept the study terms before proceeding.', 403));
  }

  next();
};

export const requirePretestCompletion = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next(new AppError('Authentication required', 401));
  }

  const pretest = await prisma.assessment.findFirst({
    where: {
      user_id: userId,
      assessment_type: 'pretest',
    },
  });

  if (!pretest) {
    return next(new AppError('Pretest completion required before accessing this resource.', 403));
  }

  next();
};
