import { PrismaClient, SurveyInstrument } from '@prisma/client';

const prisma = new PrismaClient();

interface SurveyResponseInput {
  survey_item_id: number;
  value: number;
}

interface AggregatedScores {
  perceived_utility?: number;
  ease_of_use?: number;
  motivation?: number;
  autonomy?: number;
}

interface SurveySubmissionPayload {
  instrument: SurveyInstrument | string;
  version?: string;
  responses: SurveyResponseInput[];
  comments?: string;
  aggregates?: AggregatedScores;
}

export const createSurvey = async (userId: number, surveyData: SurveySubmissionPayload) => {
  const { instrument, version = 'v1', responses, comments, aggregates } = surveyData;

  if (!responses || responses.length === 0) {
    throw new Error('At least one response is required');
  }

  const submission = await prisma.surveySubmission.create({
    data: {
      user_id: userId,
      instrument: instrument as SurveyInstrument,
      version,
      responses: {
        create: responses.map(response => ({
          survey_item_id: response.survey_item_id,
          value: response.value,
        })),
      },
    },
    include: {
      responses: {
        include: {
          item: {
            select: {
              survey_item_id: true,
              subscale: true,
            },
          },
        },
      },
    },
  });

  if (comments || aggregates) {
    await prisma.survey.create({
      data: {
        user_id: userId,
        comments: comments ?? null,
        perceived_utility: aggregates?.perceived_utility ?? null,
        ease_of_use: aggregates?.ease_of_use ?? null,
        motivation: aggregates?.motivation ?? null,
        autonomy: aggregates?.autonomy ?? null,
      },
    });
  }

  return submission;
};

export const listSurveyItems = async (instrument: SurveyInstrument | string, version = 'v1') => {
  const items = await prisma.surveyItem.findMany({
    where: {
      instrument: instrument as SurveyInstrument,
      version,
    },
    orderBy: { sort_order: 'asc' },
  });
  return items;
};
