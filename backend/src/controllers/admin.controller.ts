import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

export const getUsersController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const getActivitiesController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activities = await prisma.activity.findMany();
    res.status(200).json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
};

export const getAssessmentsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany();
    res.status(200).json(assessments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assessments' });
  }
};

export const exportDataController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataType = req.query.type as string;
    let data: any[] = [];
    let fields: string[] = [];
    let filename = 'export.csv';

    switch (dataType) {
      case 'users':
        data = await prisma.user.findMany();
        fields = ['user_id', 'first_name', 'last_name', 'email', 'age', 'education_level', 'goal', 'role', 'created_at'];
        filename = 'users.csv';
        break;
      case 'activities':
        data = await prisma.activity.findMany();
        fields = ['activity_id', 'user_id', 'activity_type', 'difficulty_level', 'attempts', 'correct_answers', 'status', 'created_at'];
        filename = 'activities.csv';
        break;
      case 'assessments':
        data = await prisma.assessment.findMany();
        fields = ['assessment_id', 'user_id', 'assessment_type', 'total_score', 'created_at'];
        filename = 'assessments.csv';
        break;
      case 'ancova':
        data = await buildAncovaDataset();
        fields = ['participant_code', 'grupo', 'pretest', 'postest', 'tam_utilidad', 'tam_facilidad', 'edad', 'education_level'];
        filename = 'ancova_dataset.csv';
        break;
      default:
        return res.status(400).json({ message: 'Invalid data type for export' });
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error exporting data' });
  }
};

const buildAncovaDataset = async () => {
  const participants = await prisma.user.findMany({
    include: {
      assignments: {
        orderBy: { assigned_at: 'desc' },
        take: 1,
      },
      assessments: true,
      surveySubmissions: {
        where: { instrument: 'tam' },
        orderBy: { submitted_at: 'desc' },
        take: 1,
        include: {
          responses: {
            include: {
              item: true,
            },
          },
        },
      },
    },
  });

  return participants.map(participant => {
    const assignment = participant.assignments[0];
    const pretest = participant.assessments.find(assessment => assessment.assessment_type === 'pretest');
    const postest = participant.assessments.find(assessment => assessment.assessment_type === 'posttest');
    const tamSubmission = participant.surveySubmissions[0];

    const tamScores = { utilidad: null as number | null, facilidad: null as number | null };

    if (tamSubmission) {
      const utilidadResponses = tamSubmission.responses.filter(response => response.item?.subscale === 'utilidad');
      const facilidadResponses = tamSubmission.responses.filter(response => response.item?.subscale === 'facilidad');

      const utilidadAverage = utilidadResponses.length
        ? utilidadResponses.reduce((sum, response) => sum + (response.value ?? 0), 0) / utilidadResponses.length
        : null;
      const facilidadAverage = facilidadResponses.length
        ? facilidadResponses.reduce((sum, response) => sum + (response.value ?? 0), 0) / facilidadResponses.length
        : null;

      tamScores.utilidad = utilidadAverage;
      tamScores.facilidad = facilidadAverage;
    }

    return {
      participant_code: participant.participant_code,
      grupo: assignment?.group ?? null,
      pretest: pretest?.total_score ?? null,
      postest: postest?.total_score ?? null,
      tam_utilidad: tamScores.utilidad,
      tam_facilidad: tamScores.facilidad,
      edad: participant.age,
      education_level: participant.education_level,
    };
  });
};
