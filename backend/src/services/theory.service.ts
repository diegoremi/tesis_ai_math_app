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

type StaticSection = {
  heading?: string;
  body?: Array<string | { math?: string; callout?: string }>;
  visualization?: {
    type: string;
    data: unknown[];
    layout?: Record<string, unknown>;
  };
};

type StaticModuleBlueprint = {
  title: string;
  description: string;
  sections: StaticSection[];
  checkpoint: {
    questions: Array<{
      id: string;
      stem: string;
      options: Array<{ key: string; label: string }>;
      correct: string;
    }>;
  };
};

const STATIC_MODULE_LIBRARY: StaticModuleBlueprint[] = [
  {
    title: 'Módulo 1: Fundamentos numéricos',
    description: 'Consolida operaciones con números enteros y fracciones aplicadas a situaciones cotidianas.',
    sections: [
      {
        heading: 'Recordatorio conceptual',
        body: [
          'Las operaciones básicas respetan propiedades que simplifican los cálculos mentales. Aprovecha la conmutatividad y asociatividad para reagrupar términos.',
          { math: 'a + b = b + a' },
          { math: '(a + b) + c = a + (b + c)' },
          { callout: 'Verifica signos y unidades para evitar errores de interpretación.' },
        ],
      },
      {
        heading: 'Ejemplo guiado',
        body: [
          'Una cooperativa reparte $3\\tfrac{1}{2}$ kg de arroz y $2\\tfrac{3}{4}$ kg de quinua en una jornada. ¿Cuánto alimento se distribuye?',
          'Convierte a fracciones impropias y usa un denominador común.',
          { math: '\\frac{7}{2} + \\frac{11}{4} = \\frac{14}{4} + \\frac{11}{4} = \\frac{25}{4} = 6\\tfrac{1}{4}' },
          { callout: 'La cooperativa entrega 6,25 kg en total. Intenta explicar el procedimiento con tus propias palabras.' },
        ],
      },
      {
        heading: 'Aplicación contextual',
        body: [
          'La gráfica muestra el avance de ejercicios correctos durante la semana. Observa cómo pequeñas prácticas diarias acumulan progreso.',
        ],
        visualization: {
          type: 'plotly',
          data: [
            {
              x: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
              y: [6, 8, 10, 12, 15],
              type: 'bar',
              marker: { color: '#38ef7d' },
            },
          ],
          layout: {
            title: 'Ejercicios correctos por sesión',
            xaxis: { title: 'Sesión' },
            yaxis: { title: 'Ejercicios' },
          },
        },
      },
    ],
    checkpoint: {
      questions: [
        {
          id: 'm1-q1',
          stem: 'Resuelve $\\frac{5}{4} + \\frac{7}{8}$.',
          options: [
            { key: 'A', label: '$\\tfrac{3}{2}$' },
            { key: 'B', label: '$\\tfrac{21}{16}$' },
            { key: 'C', label: '$\\tfrac{17}{8}$' },
            { key: 'D', label: '$\\tfrac{19}{16}$' },
          ],
          correct: 'D',
        },
        {
          id: 'm1-q2',
          stem: 'Un taller produce 45 piezas el lunes y 38 el martes. ¿Cuántas piezas produce en total?',
          options: [
            { key: 'A', label: '76' },
            { key: 'B', label: '80' },
            { key: 'C', label: '83' },
            { key: 'D', label: '88' },
          ],
          correct: 'C',
        },
      ],
    },
  },
  {
    title: 'Módulo 2: Proporciones y porcentajes',
    description: 'Relaciona razones, porcentajes y escalas para interpretar descuentos y mezclas.',
    sections: [
      {
        heading: 'Recordatorio conceptual',
        body: [
          'Una razón compara dos magnitudes. El porcentaje es una razón referida a 100. Mantén la equivalencia multiplicando ambas cantidades por el mismo factor.',
          { math: '\\frac{a}{b} = \\frac{ka}{kb}' },
        ],
      },
      {
        heading: 'Caso aplicado',
        body: [
          'Una tienda aplica 15% de descuento a un artículo de S/ 240 y luego ofrece 10% adicional sobre el nuevo precio. Calcula el monto final.',
          { math: '240 \\times 0.85 = 204' },
          { math: '204 \\times 0.90 = 183.6' },
          { callout: 'El precio final es S/ 183.60. Aplicar los descuentos de forma secuencial evita errores de suma.' },
        ],
      },
      {
        heading: 'Mini proyecto',
        body: [
          'Analiza la mezcla de un jugo donde la razón agua:concentrado es 3:2. Completa la tabla para distintas proporciones.',
        ],
        visualization: {
          type: 'plotly',
          data: [
            {
              x: [3, 6, 9],
              y: [2, 4, 6],
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Agua vs Concentrado',
              marker: { color: '#4acbb2' },
            },
          ],
          layout: {
            title: 'Razón constante 3:2',
            xaxis: { title: 'Agua (partes)' },
            yaxis: { title: 'Concentrado (partes)' },
          },
        },
      },
    ],
    checkpoint: {
      questions: [
        {
          id: 'm2-q1',
          stem: 'Un precio aumenta 12% y luego disminuye 12%. ¿Cuál es la variación neta?',
          options: [
            { key: 'A', label: '0%' },
            { key: 'B', label: '1.44% de disminución' },
            { key: 'C', label: '1.44% de aumento' },
            { key: 'D', label: '12% de disminución' },
          ],
          correct: 'B',
        },
        {
          id: 'm2-q2',
          stem: 'Completa: si 5 cuadernos cuestan S/ 40, ¿cuánto costarán 8 cuadernos?',
          options: [
            { key: 'A', label: 'S/ 56' },
            { key: 'B', label: 'S/ 60' },
            { key: 'C', label: 'S/ 64' },
            { key: 'D', label: 'S/ 72' },
          ],
          correct: 'C',
        },
      ],
    },
  },
  {
    title: 'Módulo 3: Álgebra en contexto',
    description: 'Modela situaciones con ecuaciones lineales y analiza tendencias con datos reales.',
    sections: [
      {
        heading: 'Recordatorio conceptual',
        body: [
          'Una ecuación lineal se puede escribir como $y = mx + b$, donde $m$ es la pendiente y $b$ la intersección con el eje vertical.',
          { callout: 'La pendiente describe el cambio promedio por unidad en $x$.' },
        ],
      },
      {
        heading: 'Ejemplo guiado',
        body: [
          'Resuelve $2x + 6 = 14$. Despeja la incógnita restando 6 a ambos lados y dividiendo entre 2.',
          { math: '2x = 8' },
          { math: 'x = 4' },
          { callout: 'Interpreta el resultado: con 4 unidades se satisface la ecuación inicial.' },
        ],
      },
      {
        heading: 'Análisis de tendencia',
        body: [
          'La siguiente recta muestra el progreso semanal cuando se incrementan los ejercicios correctos en 3 por sesión.',
        ],
        visualization: {
          type: 'plotly',
          data: [
            {
              x: [0, 1, 2, 3, 4],
              y: [2, 5, 8, 11, 14],
              type: 'scatter',
              mode: 'lines+markers',
              name: 'y = 3x + 2',
              marker: { color: '#38ef7d' },
            },
          ],
          layout: {
            title: 'Progreso lineal',
            xaxis: { title: 'Sesiones' },
            yaxis: { title: 'Ejercicios correctos' },
          },
        },
      },
    ],
    checkpoint: {
      questions: [
        {
          id: 'm3-q1',
          stem: 'Resuelve $3x - 5 = 10$.',
          options: [
            { key: 'A', label: 'x = 3' },
            { key: 'B', label: 'x = 4' },
            { key: 'C', label: 'x = 5' },
            { key: 'D', label: 'x = 6' },
          ],
          correct: 'D',
        },
        {
          id: 'm3-q2',
          stem: 'Una recta pasa por $(0, 1)$ y tiene pendiente 2. ¿Cuál es su ecuación?',
          options: [
            { key: 'A', label: 'y = 2x + 1' },
            { key: 'B', label: 'y = x + 2' },
            { key: 'C', label: 'y = 2x - 1' },
            { key: 'D', label: 'y = -2x + 1' },
          ],
          correct: 'A',
        },
      ],
    },
  },
];

const buildStaticModule = (moduleIndex: number, reason: 'control' | 'fallback', payload?: TheoryModuleRequest) => {
  const blueprint = STATIC_MODULE_LIBRARY[moduleIndex % STATIC_MODULE_LIBRARY.length];
  const clone = JSON.parse(JSON.stringify(blueprint)) as StaticModuleBlueprint;

  const learnerGoal = payload?.participantProfile?.goal;
  if (learnerGoal && clone.sections.length > 0) {
    clone.sections[0]!.body = [
      ...(clone.sections[0]!.body ?? []),
      { callout: `Recuerda tu meta personal: ${learnerGoal}. Ajusta el ritmo para alcanzarla.` },
    ];
  }

  const baseDescription = clone.description;
  const descriptionSuffix =
    reason === 'control'
      ? ' Material autoguiado con ejemplos resueltos.'
      : ' Contenido disponible mientras restablecemos el tutor IA.';

  return {
    moduleId: `${reason}-${moduleIndex}`,
    version: reason === 'control' ? 'control-v1' : 'fallback',
    title: clone.title,
    description: `${baseDescription}${descriptionSuffix}`,
    sections: clone.sections,
    checkpoint: clone.checkpoint,
  };
};

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

  const featureFlag = await prisma.featureFlag.findUnique({
    where: { user_id: userId },
  });
  const adaptativoEnabled = featureFlag?.adaptativo ?? false;

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

  if (!adaptativoEnabled) {
    generated = buildStaticModule(moduleIndex, 'control', requestPayload);
  } else {
    try {
      logTheory('requesting theory module from AI', { userId, moduleIndex });
      const response = await axios.post(`${AI_SERVICE_URL}/generate/theory-module`, requestPayload);
      generated = response.data;
      logTheory('received theory module from AI', { userId, moduleIndex, hasSections: Array.isArray(generated?.sections) });
    } catch (error) {
      console.error('[theory] AI generation failed, using fallback', { userId, moduleIndex, error: (error as Error).message });
      generated = createFallbackModule(requestPayload);
    }
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

const createFallbackModule = (payload: any) => buildStaticModule(payload?.moduleIndex ?? 0, 'fallback', payload);
