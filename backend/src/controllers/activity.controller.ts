
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createActivity, getActivitiesByUserId, getActivityById, updateActivity, deleteActivity } from '../services/activity.service.js';
import { recommendPracticeItem, gradePracticeAnswer } from '../services/planner.service.js';
import { logEvent } from '../services/event.service.js';

export const getExerciseController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const recommendation = await recommendPracticeItem(userId);
    await logEvent(userId, {
      event_type: 'session_start',
      metadata: {
        source: 'practice',
        item_id: recommendation.itemId,
        domain: recommendation.domain,
        competency: recommendation.competency,
      },
    });

    res.status(200).json({
      id: recommendation.itemId,
      stem: recommendation.stem,
      options: recommendation.options,
      domain: recommendation.domain,
      competency: recommendation.competency,
    });
  } catch (error) {
    console.error('Unexpected error in getExerciseController:', error);
    res.status(500).json({ message: 'Error fetching exercise' });
  }
};

export const submitAnswerController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const { exerciseId, userAnswer } = req.body;

    if (typeof exerciseId !== 'number' || typeof userAnswer !== 'string') {
      return res.status(400).json({ message: 'Invalid payload. Provide exerciseId and userAnswer.' });
    }

    const result = await gradePracticeAnswer(userId, exerciseId, userAnswer);

    await logEvent(userId, {
      event_type: result.correct ? 'correct' : 'incorrect',
      metadata: {
        source: 'practice',
        item_id: exerciseId,
      },
    });

    res.status(200).json({ correct: result.correct, summary: { attempts: result.attempts, accuracy: result.accuracy } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting answer' });
  }
};

export const createActivityController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const newActivity = await createActivity(userId, req.body);
    res.status(201).json(newActivity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating activity' });
  }
};

export const getActivitiesController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const activities = await getActivitiesByUserId(userId);
    res.status(200).json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
};

export const getActivityByIdController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activityId = Number.parseInt(req.params.id ?? '', 10);
    const activity = await getActivityById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    // Ensure the activity belongs to the authenticated user
    if (activity.user_id !== req.user?.userId) {
      return res.status(403).json({ message: 'Unauthorized access to activity' });
    }
    res.status(200).json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching activity' });
  }
};

export const updateActivityController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activityId = Number.parseInt(req.params.id ?? '', 10);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    // First, check if the activity exists and belongs to the user
    const existingActivity = await getActivityById(activityId);
    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    if (existingActivity.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this activity' });
    }

    const updatedActivity = await updateActivity(activityId, req.body);
    res.status(200).json(updatedActivity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating activity' });
  }
};

export const deleteActivityController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activityId = Number.parseInt(req.params.id ?? '', 10);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    // First, check if the activity exists and belongs to the user
    const existingActivity = await getActivityById(activityId);
    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    if (existingActivity.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this activity' });
    }

    await deleteActivity(activityId);
    res.status(204).send(); // No content
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting activity' });
  }
};
