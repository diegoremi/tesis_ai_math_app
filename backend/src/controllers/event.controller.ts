import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { logEvent, listEvents } from '../services/event.service.js';
import { AppError } from '../middleware/errorHandler.js';

const VALID_EVENT_TYPES = [
  'session_start',
  'session_end',
  'hint',
  'correct',
  'incorrect',
  'streak',
  'goal_met',
  'theory_start',
  'theory_progress',
  'theory_end',
  'checkpoint_passed',
];

export const createEventController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { event_type } = req.body;
  if (!event_type) {
    throw new AppError('event_type is required', 400);
  }
  if (!VALID_EVENT_TYPES.includes(event_type)) {
    throw new AppError(`Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`, 400);
  }

  const event = await logEvent(userId, req.body);
  res.status(201).json(event);
};

export const listEventsController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const rawLimit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : 200;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 || rawLimit > 1000 ? 200 : rawLimit;

  const events = await listEvents(userId, limit);
  res.status(200).json(events);
};
