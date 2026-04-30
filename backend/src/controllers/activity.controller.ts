import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createActivity, getActivitiesByUserId, getActivityById, updateActivity, deleteActivity } from '../services/activity.service.js';
import { fetchNextPracticeItem, submitPracticeAnswer } from '../services/practice.service.js';
import { logEvent } from '../services/event.service.js';
import { AppError } from '../middleware/errorHandler.js';

function validateIdParam(param: string | undefined): number {
  const id = Number.parseInt(param ?? '', 10);
  if (Number.isNaN(id)) {
    throw new AppError('Invalid ID parameter', 400);
  }
  return id;
}

export const getExerciseController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { record, item } = await fetchNextPracticeItem(userId);

  await logEvent(userId, {
    event_type: 'session_start',
    metadata: {
      source: 'practice',
      item_id: record.practice_generated_id,
      session_id: record.session_id,
      domain: item.meta.domain,
      competency: item.meta.skill,
    },
  });

  res.status(200).json({
    id: record.practice_generated_id,
    stem: item.stem,
    options: item.options.map((option: { key: string; text: string }) => ({
      key: option.key,
      label: option.text,
    })),
    domain: item.meta.domain,
    competency: item.meta.skill,
    metadata: {
      session_id: record.session_id,
      topic: record.topic,
      difficulty: record.difficulty,
    },
  });
};

export const submitAnswerController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const { exerciseId, userAnswer } = req.body;

  if (typeof exerciseId !== 'number' || typeof userAnswer !== 'string') {
    throw new AppError('Invalid payload. Provide exerciseId and userAnswer.', 400);
  }

  const result = await submitPracticeAnswer(userId, exerciseId, userAnswer);

  await logEvent(userId, {
    event_type: result.correct ? 'correct' : 'incorrect',
    metadata: {
      source: 'practice',
      item_id: exerciseId,
      domain: result.domain,
      competency: result.competency,
    },
  });

  res.status(200).json({
    correct: result.correct,
    explanation: result.explanation,
    summary: {
      attempts: result.attempts,
      accuracy: result.accuracy,
    },
  });
};

export const createActivityController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }
  const newActivity = await createActivity(userId, req.body);
  res.status(201).json(newActivity);
};

export const getActivitiesController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }
  const activities = await getActivitiesByUserId(userId);
  res.status(200).json(activities);
};

export const getActivityByIdController = async (req: AuthenticatedRequest, res: Response) => {
  const activityId = validateIdParam(req.params.id);
  const activity = await getActivityById(activityId);
  if (!activity) {
    throw new AppError('Activity not found', 404);
  }
  // Ensure the activity belongs to the authenticated user
  if (activity.user_id !== req.user?.userId) {
    throw new AppError('Unauthorized access to activity', 403);
  }
  res.status(200).json(activity);
};

export const updateActivityController = async (req: AuthenticatedRequest, res: Response) => {
  const activityId = validateIdParam(req.params.id);
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const existingActivity = await getActivityById(activityId);
  if (!existingActivity) {
    throw new AppError('Activity not found', 404);
  }
  if (existingActivity.user_id !== userId) {
    throw new AppError('Unauthorized to update this activity', 403);
  }

  const updatedActivity = await updateActivity(activityId, req.body);
  res.status(200).json(updatedActivity);
};

export const deleteActivityController = async (req: AuthenticatedRequest, res: Response) => {
  const activityId = validateIdParam(req.params.id);
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  const existingActivity = await getActivityById(activityId);
  if (!existingActivity) {
    throw new AppError('Activity not found', 404);
  }
  if (existingActivity.user_id !== userId) {
    throw new AppError('Unauthorized to delete this activity', 403);
  }

  await deleteActivity(activityId);
  res.status(204).send();
};
