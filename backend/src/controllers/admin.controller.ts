import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { PrismaClient, type SurveySubmission, type SurveyResponse, type SurveyItem, AssignmentGroup, AssignmentMethod } from '@prisma/client';
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
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
        featureFlag: {
          select: {
            chatbot: true,
            adaptativo: true,
          },
        },
        assignments: {
          orderBy: { assigned_at: 'desc' },
          take: 1,
          select: {
            group: true,
            assigned_at: true,
            method: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
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

export const exportFullReportController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await buildFullReport();
    res.status(200).json(report);
  } catch (error) {
    console.error('Error building full report', error);
    res.status(500).json({ message: 'Error building full report' });
  }
};

export const updateFeatureFlagsAdminController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Solo el personal administrador puede modificar los flags' });
    }

    const userId = Number.parseInt(req.params.userId ?? '', 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const { chatbot, adaptativo } = req.body ?? {};
    if (typeof chatbot !== 'boolean' && typeof adaptativo !== 'boolean') {
      return res.status(400).json({ message: 'Provide at least one flag to update' });
    }

    let assignment = await prisma.assignment.findFirst({
      where: { user_id: userId },
      orderBy: { assigned_at: 'desc' },
    });

    const existingFlags = await prisma.featureFlag.findUnique({ where: { user_id: userId } });
    const nextAdaptativo = typeof adaptativo === 'boolean' ? adaptativo : existingFlags?.adaptativo ?? false;
    const nextChatbot = typeof chatbot === 'boolean' ? chatbot : existingFlags?.chatbot ?? false;

    let targetGroup = assignment?.group ?? null;

    if (typeof adaptativo === 'boolean') {
      targetGroup = nextAdaptativo ? AssignmentGroup.GE : AssignmentGroup.GC;
      if (assignment) {
        assignment = await prisma.assignment.update({
          where: { assignment_id: assignment.assignment_id },
          data: {
            group: targetGroup,
          },
        });
      } else {
        assignment = await prisma.assignment.create({
          data: {
            user_id: userId,
            group: targetGroup,
            method: AssignmentMethod.emparejamiento,
            seed: 'admin-toggle',
          },
        });
      }
    }

    const updatedFlags = await prisma.featureFlag.upsert({
      where: { user_id: userId },
      update: {
        chatbot: nextChatbot,
        adaptativo: nextAdaptativo,
      },
      create: {
        user_id: userId,
        chatbot: nextChatbot,
        adaptativo: nextAdaptativo,
      },
    });

    res.status(200).json({
      featureFlag: updatedFlags,
      assignment: assignment?.group ?? targetGroup,
    });
  } catch (error) {
    console.error('updateFeatureFlagsAdminController', error);
    res.status(500).json({ message: 'Error updating feature flags' });
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

const buildFullReport = async () => {
  const [participantsTotal, dataset, tamSubmissions, activities] = await Promise.all([
    prisma.user.count(),
    buildAncovaDataset(),
    prisma.surveySubmission.findMany({
      where: { instrument: 'tam' },
      include: {
        responses: {
          include: { item: true },
        },
      },
    }),
    prisma.activity.findMany({ where: { activity_type: 'exercise' } }),
  ]);

  const groupBuckets = dataset.reduce((acc, row) => {
    const key = row.grupo ?? 'SIN_GRUPO';
    const bucket = acc.get(key) ?? { rows: [] as typeof dataset };
    bucket.rows.push(row);
    acc.set(key, bucket);
    return acc;
  }, new Map<string, { rows: typeof dataset }>());

  const average = (values: Array<number | null | undefined>) => {
    const filtered = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (!filtered.length) {
      return null;
    }
    return Number((filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(2));
  };

  const groupPerformance = Array.from(groupBuckets.entries()).map(([group, bucket]) => {
    const rows = bucket.rows;
    const pre = average(rows.map((row) => row.pretest));
    const post = average(rows.map((row) => row.postest));
    const delta = pre !== null && post !== null ? Number((post - pre).toFixed(2)) : null;
    const tamUtilidad = average(rows.map((row) => row.tam_utilidad));
    const tamFacilidad = average(rows.map((row) => row.tam_facilidad));
    const motivation = average(rows.map((row) => row.mot_post));
    const autonomy = average(rows.map((row) => row.auto_post));
    const sessions = average(rows.map((row) => row.sesiones_semana));

    return {
      group,
      participants: rows.length,
      pretestAverage: pre,
      posttestAverage: post,
      delta,
      tamUtilidad,
      tamFacilidad,
      motivation,
      autonomy,
      sessionsPerWeek: sessions,
    };
  });

  const tamSummary = tamSubmissions.map((submission) => {
    const bucket = submission.responses.reduce((acc, response) => {
      if (!response.item?.subscale || typeof response.value !== 'number') {
        return acc;
      }
      const entry = acc.get(response.item.subscale) ?? [];
      entry.push(response.value);
      acc.set(response.item.subscale, entry);
      return acc;
    }, new Map<string, number[]>());

    const subscales = Array.from(bucket.entries()).map(([subscale, values]) => ({
      subscale,
      average: average(values),
    }));

    return {
      userId: submission.user_id,
      timepoint: submission.timepoint,
      subscales,
    };
  });

  const activitySummary = activities.reduce((acc, activity) => {
    const domain = activity.domain ?? 'sin_dominio';
    const entry = acc.get(domain) ?? { attempts: 0, correct: 0 };
    entry.attempts += activity.attempts ?? 0;
    entry.correct += activity.correct_answers ?? 0;
    acc.set(domain, entry);
    return acc;
  }, new Map<string, { attempts: number; correct: number }>());

  const activitiesAggregated = Array.from(activitySummary.entries()).map(([domain, values]) => ({
    domain,
    attempts: values.attempts,
    correct: values.correct,
    accuracy: values.attempts ? Number((values.correct / values.attempts).toFixed(2)) : null,
  }));

  return {
    generatedAt: new Date().toISOString(),
    participantsTotal,
    datasetSize: dataset.length,
    groupPerformance,
    tamSummary,
    activitiesAggregated,
    ancovaDataset: dataset,
  };
};
