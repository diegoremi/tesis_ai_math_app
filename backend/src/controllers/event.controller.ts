import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { logEvent, listEvents } from '../services/event.service.js';

export const createEventController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    if (!req.body.event_type) {
      return res.status(400).json({ message: 'event_type is required' });
    }

    const event = await logEvent(userId, req.body);
    res.status(201).json(event);
  } catch (error) {
    console.error('createEventController', error);
    res.status(500).json({ message: 'Error logging event' });
  }
};

export const listEventsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
    const events = await listEvents(userId, limit ?? 200);
    res.status(200).json(events);
  } catch (error) {
    console.error('listEventsController', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};
