
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createActivity, getActivitiesByUserId, getActivityById, updateActivity, deleteActivity } from '../services/activity.service.js';
import { getUserById } from '../services/user.service.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getExerciseController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activities = await getActivitiesByUserId(userId);
    const totalAttempts = activities.reduce((sum, act) => sum + act.attempts, 0);
    const totalCorrect = activities.reduce((sum, act) => sum + act.correct_answers, 0);
    const performance = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    let difficulty = 'basic';
    if (performance >= 0.7) {
      difficulty = 'advanced';
    } else if (performance >= 0.4) {
      difficulty = 'intermediate';
    }

    const prompt = `Generate a ${difficulty} ${user.education_level} level math problem for a ${user.age}-year-old ${user.gender} user with a ${user.math_level} math level. The problem should be concise and have a clear numerical answer.`;

    const aiResponse = await axios.post('http://localhost:8001/generate_exercise', { prompt });
    const exercise = aiResponse.data;

    res.status(200).json(exercise);
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

    const exercisesPath = path.join(__dirname, '../data/exercises.json');
    const data = await fs.readFile(exercisesPath, 'utf-8');
    const exercises = JSON.parse(data);

    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const isCorrect = exercise.answer.toLowerCase() === userAnswer.toLowerCase();

    const activities = await getActivitiesByUserId(userId);
    let activity = activities.find(act => act.activity_type === exercise.type);

    if (activity) {
      const updatedActivity = await updateActivity(activity.activity_id, {
        attempts: activity.attempts + 1,
        correct_answers: activity.correct_answers + (isCorrect ? 1 : 0),
      });
      res.status(200).json({ correct: isCorrect, activity: updatedActivity });
    } else {
      const newActivity = await createActivity(userId, {
        activity_type: exercise.type,
        difficulty_level: exercise.difficulty,
        attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        status: 'pending',
      });
      res.status(201).json({ correct: isCorrect, activity: newActivity });
    }
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
    const activityId = parseInt(req.params.id);
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
    const activityId = parseInt(req.params.id);
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
    const activityId = parseInt(req.params.id);
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
