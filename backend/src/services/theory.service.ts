import { PrismaClient, Prisma } from '@prisma/client';
import axios from 'axios';
import { logEvent } from './event.service.js';

const prisma = new PrismaClient();

const logTheory = (...args: unknown[]) => {
  console.log('[theory]', ...args);
};

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';

const MIN_MODULES_REQUIRED = Number.parseInt(process.env.MIN_THEORY_MODULES_REQUIRED ?? '3', 10);
const MIN_CHECKPOINTS_REQUIRED = Number.parseInt(process.env.MIN_THEORY_CHECKPOINTS_REQUIRED ?? '3', 10);

interface GenerateTheoryPayload {
  moduleIndex: number;
}

interface TheoryProgressPayload {
  moduleId: number;
  progress: number;
  elapsedSeconds?: number;
}

interface TheoryCheckpointPayload {
  moduleId: number;
  answers: Array<{ id: string | number; answer: string }>;
}

const clampProgress = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

export const generateTheoryModule = async (userId: number, payload: GenerateTheoryPayload) => {
  const moduleIndex = payload.moduleIndex ?? 0;

  const existingModule = await prisma.theoryModule.findUnique({
    where: {
      user_id_module_index: {
        user_id: userId,
        module_index: moduleIndex,
      },
    },
    include: {
      progress: true,
    },
  });

  if (existingModule) {
    logTheory('reusing existing module', { userId, moduleIndex: existingModule.module_index, moduleId: existingModule.module_id });
    const progress = existingModule.progress[0] ?? null;
    return {
      module: existingModule,
      progress,
      requirements: {
        requiredModules: MIN_MODULES_REQUIRED,
        requiredCheckpoints: MIN_CHECKPOINTS_REQUIRED,
      },
    };
  }

  const userProfile = await prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      assessments: {
        where: { assessment_type: 'pretest' },
        include: { responses: true },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      surveys: {
        orderBy: { created_at: 'asc' },
        take: 1,
      },
    },
  });

  if (!userProfile) {
    throw new Error('User not found');
  }

  const pretest = userProfile.assessments[0] ?? null;
  const survey = userProfile.surveys[0] ?? null;

  const requestPayload = {
    participantProfile: {
      age: userProfile.age,
      educationLevel: userProfile.education_level,
      mathLevel: userProfile.math_level,
      goal: userProfile.goal,
      createdAt: userProfile.created_at,
    },
    pretestSummary: pretest
      ? {
          totalScore: pretest.total_score,
          responses: pretest.responses.map((response) => ({
            itemId: response.item_id,
            answer: response.answer,
            isCorrect: response.is_correct,
          })),
        }
      : null,
    reflection: survey?.comments ?? null,
    moduleIndex,
  };

  let generated;

  try {
    logTheory('requesting theory module from AI', { userId, moduleIndex });
    const response = await axios.post(`${AI_SERVICE_URL}/generate/theory-module`, requestPayload);
    generated = response.data;
    logTheory('received theory module from AI', { userId, moduleIndex, hasSections: Array.isArray(generated?.sections) });
  } catch (error) {
    console.error('[theory] AI generation failed, using fallback', { userId, moduleIndex, error: (error as Error).message });
    generated = createFallbackModule(requestPayload);
  }

  if (!generated || typeof generated !== 'object') {
    throw new Error('AI response malformed for theory module');
  }

  let moduleRecord;

  try {
    moduleRecord = await prisma.theoryModule.create({
      data: {
        user_id: userId,
        module_index: moduleIndex,
        title: String(generated.title ?? `Módulo ${moduleIndex + 1}`),
        description: typeof generated.description === 'string' ? generated.description : null,
        content: generated,
        version: generated.version ?? 'v1',
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      moduleRecord = await prisma.theoryModule.findUnique({
        where: {
          user_id_module_index: {
            user_id: userId,
            module_index: moduleIndex,
          },
        },
      });
      if (!moduleRecord) {
        throw error;
      }
    } else {
      throw error;
    }
  }

  const progressRecord = await prisma.theoryProgress.upsert({
    where: {
      module_id_user_id: {
        module_id: moduleRecord.module_id,
        user_id: userId,
      },
    },
    update: {},
    create: {
      module_id: moduleRecord.module_id,
      user_id: userId,
    },
  });

  logTheory('stored new theory module', { userId, moduleId: moduleRecord.module_id, moduleIndex });

  return {
    module: moduleRecord,
    progress: progressRecord,
    requirements: {
      requiredModules: MIN_MODULES_REQUIRED,
      requiredCheckpoints: MIN_CHECKPOINTS_REQUIRED,
    },
  };
};

export const updateTheoryProgress = async (userId: number, payload: TheoryProgressPayload) => {
  const { moduleId, progress, elapsedSeconds = 0 } = payload;
  const module = await prisma.theoryModule.findUnique({ where: { module_id: moduleId } });

  if (!module || module.user_id !== userId) {
    throw new Error('Theory module not found for user');
  }

  const existingProgress = await prisma.theoryProgress.findUnique({
    where: {
      module_id_user_id: {
        module_id: moduleId,
        user_id: userId,
      },
    },
  });

  const nextProgress = clampProgress(progress);
  const secondsDelta = elapsedSeconds > 0 ? Math.round(elapsedSeconds) : 0;

  const updated = await prisma.theoryProgress.upsert({
    where: {
      module_id_user_id: {
        module_id: moduleId,
        user_id: userId,
      },
    },
    update: {
      progress: nextProgress > (existingProgress?.progress ?? 0) ? nextProgress : existingProgress?.progress ?? nextProgress,
      seconds_spent: (existingProgress?.seconds_spent ?? 0) + secondsDelta,
      completed_at:
        nextProgress >= 1 && !existingProgress?.completed_at ? new Date() : existingProgress?.completed_at ?? null,
    },
    create: {
      module_id: moduleId,
      user_id: userId,
      progress: nextProgress,
      seconds_spent: secondsDelta,
      completed_at: nextProgress >= 1 ? new Date() : null,
    },
  });

  if (!existingProgress) {
    await logEvent(userId, {
      event_type: 'theory_start',
      metadata: { module_id: moduleId, module_index: module.module_index },
    });
    logTheory('theory module started', { userId, moduleId, moduleIndex: module.module_index });
  }

  await logEvent(userId, {
    event_type: 'theory_progress',
    metadata: {
      module_id: moduleId,
      module_index: module.module_index,
      progress: nextProgress,
      seconds_spent: secondsDelta,
    },
  });

  logTheory('theory progress recorded', {
    userId,
    moduleId,
    moduleIndex: module.module_index,
    progress: nextProgress,
    secondsSpent: updated.seconds_spent,
  });

  if (nextProgress >= 1 && (!existingProgress || !existingProgress.completed_at)) {
    await logEvent(userId, {
      event_type: 'theory_end',
      metadata: {
        module_id: moduleId,
        module_index: module.module_index,
        total_seconds: updated.seconds_spent,
      },
    });
    logTheory('theory module completed', { userId, moduleId, moduleIndex: module.module_index });
  }

  return updated;
};

export const submitTheoryCheckpoint = async (userId: number, payload: TheoryCheckpointPayload) => {
  const { moduleId, answers } = payload;
  const module = await prisma.theoryModule.findUnique({ where: { module_id: moduleId } });
  if (!module || module.user_id !== userId) {
    throw new Error('Theory module not found for user');
  }

  const content = module.content as any;
  const checkpoint = content?.checkpoint;
  if (!checkpoint || !Array.isArray(checkpoint.questions)) {
    throw new Error('Theory module lacks checkpoint definition');
  }

  const answerMap = new Map<string, string>();
  answers.forEach((entry) => {
    answerMap.set(String(entry.id), String(entry.answer));
  });

  const evaluation = checkpoint.questions.map((question: any) => {
    const expected = String(question.correct ?? question.answer ?? '').trim().toLowerCase();
    const provided = String(answerMap.get(String(question.id ?? question.question_id ?? question.key ?? '')) ?? '').trim().toLowerCase();
    const isCorrect = expected.length > 0 ? expected === provided : false;
    return {
      id: question.id ?? question.question_id ?? question.key,
      correct: isCorrect,
    };
  });

  const passed = evaluation.every((entry: { correct: boolean }) => entry.correct);

  const progress = await prisma.theoryProgress.upsert({
    where: {
      module_id_user_id: {
        module_id: moduleId,
        user_id: userId,
      },
    },
    update: {
      checkpoint_passed: passed || undefined,
    },
    create: {
      module_id: moduleId,
      user_id: userId,
      checkpoint_passed: passed,
    },
  });

  if (passed) {
    await logEvent(userId, {
      event_type: 'checkpoint_passed',
      metadata: {
        module_id: moduleId,
        module_index: module.module_index,
      },
    });
    logTheory('checkpoint passed', { userId, moduleId, moduleIndex: module.module_index });
  }

  return {
    passed,
    evaluation,
    progress,
  };
};

export const getStudyStatus = async (userId: number) => {
  const modules = await prisma.theoryModule.findMany({
    where: { user_id: userId },
    include: {
      progress: true,
    },
  });

  const progressRecords = modules.map((module) => module.progress[0]).filter((record): record is NonNullable<typeof record> => Boolean(record));

  const modulesCompleted = progressRecords.filter((record) => (record.progress ?? 0) >= 1).length;
  const checkpointsPassed = progressRecords.filter((record) => record.checkpoint_passed).length;
  const secondsSpent = progressRecords.reduce((sum, record) => sum + (record.seconds_spent ?? 0), 0);

  const posttestUnlocked = modulesCompleted >= MIN_MODULES_REQUIRED && checkpointsPassed >= MIN_CHECKPOINTS_REQUIRED;

  logTheory('study status computed', {
    userId,
    modulesGenerated: modules.length,
    modulesCompleted,
    checkpointsPassed,
    posttestUnlocked,
  });

  return {
    modulesCompleted,
    checkpointsPassed,
    secondsSpent,
    minutesInTheory: Number((secondsSpent / 60).toFixed(1)),
    requiredModules: MIN_MODULES_REQUIRED,
    requiredCheckpoints: MIN_CHECKPOINTS_REQUIRED,
    posttestUnlocked,
    generatedModules: modules.length,
  };
};

const createFallbackModule = (payload: any) => {
  const moduleIndex = payload?.moduleIndex ?? 0;
  const level = payload?.participantProfile?.mathLevel ?? 'intermediate';
  const title = `Módulo ${moduleIndex + 1}: Fundamentos ${level === 'beginner' ? 'básicos' : level === 'advanced' ? 'avanzados' : 'intermedios'}`;

  return {
    moduleId: `fallback-${moduleIndex}`,
    version: 'fallback',
    title,
    description: 'Contenido generado localmente por falta de conexión con el servicio IA.',
    sections: [
      {
        heading: 'Recordatorio conceptual',
        body: [
          'Repasa las operaciones fundamentales y asegúrate de dominar las propiedades antes de avanzar.',
          {
            math: 'a^2 + b^2 = c^2',
          },
        ],
      },
      {
        heading: 'Ejemplo trabajado',
        body: [
          'Considera la ecuación $\\frac{3}{4}x + 2 = 5$. Resuelve despejando la incógnita.',
        ],
      },
      {
        visualization: {
          type: 'plotly',
          data: [
            {
              x: [0, 1, 2, 3, 4],
              y: [0, 1, 4, 9, 16],
              type: 'scatter',
              mode: 'lines+markers',
              name: 'y = x^2',
            },
          ],
          layout: {
            title: 'Función cuadrática',
            xaxis: { title: 'x' },
            yaxis: { title: 'y' },
          },
        },
      },
    ],
    checkpoint: {
      questions: [
        {
          id: 'q1',
          stem: 'Resuelve la ecuación $2x + 6 = 14$. ¿Cuál es el valor de $x$?',
          options: [
            { key: 'A', label: '2' },
            { key: 'B', label: '3' },
            { key: 'C', label: '4' },
            { key: 'D', label: '5' },
          ],
          correct: 'C',
        },
      ],
    },
  };
};
