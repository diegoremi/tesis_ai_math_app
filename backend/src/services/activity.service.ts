
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createActivity = async (userId: number, activityData: any) => {
  const { activity_type, difficulty_level, attempts, correct_answers, status } = activityData;
  const newActivity = await prisma.activity.create({
    data: {
      user_id: userId,
      activity_type,
      difficulty_level,
      attempts,
      correct_answers,
      status,
    },
  });
  return newActivity;
};

export const getActivitiesByUserId = async (userId: number) => {
  const activities = await prisma.activity.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return activities;
};

export const getActivityById = async (activityId: number) => {
  const activity = await prisma.activity.findUnique({
    where: { activity_id: activityId },
  });
  return activity;
};

export const updateActivity = async (activityId: number, activityData: any) => {
  const updatedActivity = await prisma.activity.update({
    where: { activity_id: activityId },
    data: activityData,
  });
  return updatedActivity;
};

export const deleteActivity = async (activityId: number) => {
  const deletedActivity = await prisma.activity.delete({
    where: { activity_id: activityId },
  });
  return deletedActivity;
};
