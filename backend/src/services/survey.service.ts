import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSurvey = async (userId: number, surveyData: any) => {
  const { perceived_utility, ease_of_use, motivation, autonomy, comments } = surveyData;
  const newSurvey = await prisma.survey.create({
    data: {
      user_id: userId,
      perceived_utility,
      ease_of_use,
      motivation,
      autonomy,
      comments,
    },
  });
  return newSurvey;
};
