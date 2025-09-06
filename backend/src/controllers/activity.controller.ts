
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createActivity, getActivitiesByUserId, getActivityById, updateActivity, deleteActivity } from '../services/activity.service.js';

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
