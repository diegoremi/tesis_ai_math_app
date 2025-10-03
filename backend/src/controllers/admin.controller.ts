import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { PrismaClient, type SurveySubmission, type SurveyResponse, type SurveyItem } from '@prisma/client';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

const EDUCATION_LEVEL_MAP: Record<string, string> = {
  high_school: 'secundaria',
  university: 'universitaria',
  other: 'otro',
};

const average = (values: number[], decimals = 2) => {
  if (!values.length) {
    return null;
  }
  const raw = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number(raw.toFixed(decimals));
};

const numericResponses = (submission: SurveySubmission & { responses: (SurveyResponse & { item: SurveyItem | null })[] }) => {
  return submission.responses
    .map((response) => Number(response.value ?? Number.NaN))
    .filter((value) => Number.isFinite(value));
};

const averageBySubscale = (
  submission: SurveySubmission & { responses: (SurveyResponse & { item: SurveyItem | null })[] },
  subscale: string,
) => {
  const values = submission.responses
    .filter((response) => response.item?.subscale === subscale)
    .map((response) => Number(response.value ?? Number.NaN))
    .filter((value) => Number.isFinite(value));
  return average(values);
};

const findSubmission = (
  submissions: (SurveySubmission & { responses: (SurveyResponse & { item: SurveyItem | null })[] })[],
  instrument: string,
  timepoint?: string,
) => {
  const filtered = submissions.filter((submission) => {
    if (submission.instrument !== instrument) return false;
    if (timepoint && submission.timepoint !== timepoint) return false;
    return true;
  });
  if (!filtered.length) {
    return null;
  }
  filtered.sort((a, b) => b.submitted_at.getTime() - a.submitted_at.getTime());
  return filtered[0] ?? null;
};

const sumFromMetadata = (events: { metadata: unknown }[], keys: string[]) => {
  return events.reduce((total, event) => {
    if (!event.metadata || typeof event.metadata !== 'object') {
      return total;
    }
    const candidate = keys
      .map((key) => {
        if (key in (event.metadata as Record<string, unknown>)) {
          return Number((event.metadata as Record<string, unknown>)[key] as number | string);
        }
        return Number.NaN;
      })
      .find((value) => Number.isFinite(value));
    if (candidate !== undefined && Number.isFinite(candidate)) {
      return total + Number(candidate);
    }
    return total;
  }, 0);
};

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
    const outputFormat = (req.query.format as string | undefined)?.toLowerCase();
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
        fields = [
          'id_usuario',
          'grupo',
          'pretest',
          'postest',
          'tam_utilidad',
          'tam_facilidad',
          'mot_pre',
          'mot_post',
          'auto_pre',
          'auto_post',
          'sesiones_semana',
          'minutos_totales',
          'ejercicios_resueltos',
          'porc_aciertos',
          'edad',
          'nivel_estudio',
        ];
        filename = 'ancova_dataset.csv';
        break;
      default:
        return res.status(400).json({ message: 'Invalid data type for export' });
    }

    if (dataType === 'ancova' && outputFormat === 'json') {
      return res.status(200).json({ rows: data, generatedAt: new Date().toISOString() });
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

export const exportAncovaDatasetController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await buildAncovaDataset();
    res.status(200).json({ rows: dataset, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error building ANCOVA dataset', error);
    res.status(500).json({ message: 'Error building ANCOVA dataset' });
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
        include: {
          responses: {
            include: {
              item: true,
            },
          },
        },
      },
      activities: {
        where: { activity_type: 'exercise' },
      },
      events: true,
    },
  });

  return participants
    .map((participant) => {
      const assignment = participant.assignments[0];
      const pretest = participant.assessments.find((assessment) => assessment.assessment_type === 'pretest');
      const postest = participant.assessments.find((assessment) => assessment.assessment_type === 'posttest');

      if (!postest || postest.total_score == null) {
        return null;
      }

      const tamSubmission = findSubmission(participant.surveySubmissions, 'tam', 'exit')
        ?? findSubmission(participant.surveySubmissions, 'tam');
      const motivationPre = findSubmission(participant.surveySubmissions, 'motivacion', 'pre');
      const motivationPost = findSubmission(participant.surveySubmissions, 'motivacion', 'post')
        ?? findSubmission(participant.surveySubmissions, 'motivacion', 'exit');
      const autonomyPre = findSubmission(participant.surveySubmissions, 'autonomia', 'pre');
      const autonomyPost = findSubmission(participant.surveySubmissions, 'autonomia', 'post')
        ?? findSubmission(participant.surveySubmissions, 'autonomia', 'exit');

      const tamUtilidad = tamSubmission ? averageBySubscale(tamSubmission, 'utilidad') : null;
      const tamFacilidad = tamSubmission ? averageBySubscale(tamSubmission, 'facilidad') : null;
      const motPre = motivationPre ? average(numericResponses(motivationPre)) : null;
      const motPost = motivationPost ? average(numericResponses(motivationPost)) : null;
      const autoPre = autonomyPre ? average(numericResponses(autonomyPre)) : null;
      const autoPost = autonomyPost ? average(numericResponses(autonomyPost)) : null;

      const totalCorrect = participant.activities.reduce((sum, activity) => sum + (activity.correct_answers ?? 0), 0);
      const totalAttempts = participant.activities.reduce((sum, activity) => sum + (activity.attempts ?? 0), 0);
      const exercisesSolved = totalCorrect;
      const accuracy = totalAttempts > 0 ? Number((totalCorrect / totalAttempts).toFixed(2)) : null;

      const sessionEvents = participant.events.filter((event) => event.event_type === 'session_start');
      let sessionsPerWeek = 0;
      if (sessionEvents.length > 0) {
        const sortedSessions = [...sessionEvents].sort(
          (a, b) => a.occurred_at.getTime() - b.occurred_at.getTime(),
        );
        const first = sortedSessions[0]!.occurred_at;
        const last = sortedSessions[sortedSessions.length - 1]!.occurred_at;
        const activeDays = Math.max(1, (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
        const weeks = Math.max(1, activeDays / 7);
        sessionsPerWeek = Number((sessionEvents.length / weeks).toFixed(2));
      }

      const totalDurationSeconds = sumFromMetadata(participant.events, [
        'duracion_seg',
        'duration_seg',
        'duration_seconds',
        'duracionSeg',
        'duration',
      ]);
      const totalMinutes = Number((totalDurationSeconds / 60).toFixed(0));

      return {
        id_usuario: participant.participant_code,
        grupo: assignment?.group ?? null,
        pretest: pretest?.total_score ?? null,
        postest: postest?.total_score ?? null,
        tam_utilidad: tamUtilidad,
        tam_facilidad: tamFacilidad,
        mot_pre: motPre,
        mot_post: motPost,
        auto_pre: autoPre,
        auto_post: autoPost,
        sesiones_semana: sessionsPerWeek,
        minutos_totales: totalMinutes,
        ejercicios_resueltos: exercisesSolved,
        porc_aciertos: accuracy,
        edad: participant.age ?? null,
        nivel_estudio: participant.education_level
          ? EDUCATION_LEVEL_MAP[participant.education_level] ?? participant.education_level
          : null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
};
