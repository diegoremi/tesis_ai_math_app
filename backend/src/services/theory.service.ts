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
    title: 'Módulo 1: Fluidez con números',
    description: 'Reforzá cálculos con enteros y fracciones usando estrategias mentales y estimaciones.',
    sections: [
      {
        heading: 'Recordatorio conceptual',
        body: [
          'Usá las propiedades conmutativa y asociativa para reagrupar términos antes de calcular.',
          { math: 'a + b = b + a' },
          { math: '(a + b) + c = a + (b + c)' },
          { callout: 'Cuando sumes o restes fracciones, buscá denominadores equivalentes antes de operar.' },
        ],
      },
      {
        heading: 'Ejemplo guiado',
        body: [
          'Un comedor comunitario mezcla $3\\tfrac{1}{2}$ kg de arroz y $2\\tfrac{3}{4}$ kg de quinua. Convertí a fracciones impropias y sumá con denominador común.',
          { math: '\\frac{7}{2} + \\frac{11}{4} = \\frac{14}{4} + \\frac{11}{4} = \\frac{25}{4} = 6\\tfrac{1}{4}' },
          { callout: 'El resultado final es 6,25 kg. Explicá el procedimiento a un compañero para fijar el razonamiento.' },
        ],
      },
      {
        heading: 'Aplicación contextual',
        body: [
          'La gráfica muestra cómo crecen los ejercicios correctos al practicar 15 minutos diarios.',
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
    description: 'Aplicá porcentajes encadenados, escalas y razones para tomar decisiones informadas.',
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
    title: 'Módulo 3: Álgebra aplicada',
    description: 'Modela situaciones cotidianas con ecuaciones lineales y analiza tendencias en datos reales.',
    sections: [
      {
        heading: 'Recordatorio conceptual',
        body: [
          'Una ecuación lineal se expresa como $y = mx + b$, donde $m$ indica cuánto cambia $y$ cuando $x$ aumenta una unidad.',
          { callout: 'La pendiente describe el cambio promedio por unidad en $x$.' },
        ],
      },
      {
        heading: 'Ejemplo guiado',
        body: [
          'Resuelve $2x + 6 = 14$. Restá 6 en ambos lados y dividí entre 2 para despejar la incógnita.',
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
  {
    title: 'Módulo 4: Resolución de problemas',
    description: 'Descompone situaciones de varios pasos usando tablas, diagramas y ecuaciones cortas.',
    sections: [
      {
        heading: 'Estrategias clave',
        body: [
          'Identificá los datos relevantes y anotá lo que te piden. Diseña un esquema (tabla o diagrama) antes de operar.',
          { callout: 'Verbaliza cada paso: “sumo”, “multiplico”, “divido” para evitar operaciones incorrectas.' },
        ],
      },
      {
        heading: 'Ejemplo paso a paso',
        body: [
          'Una fábrica produce lotes de 24 piezas. Para completar un pedido de 350, ¿cuántos lotes completos y cuántas piezas sueltas necesita?',
          { math: '350 \\div 24 = 14 \\text{ lotes } + 14 \\text{ piezas}' },
          { callout: 'Documenta la respuesta: 14 lotes completos y 14 piezas sueltas.' },
        ],
      },
      {
        heading: 'Visualización de objetivos',
        body: [
          'Planificá sesiones semanales con metas de ejercicios resueltos para sostener el hábito.',
        ],
        visualization: {
          type: 'plotly',
          data: [
            {
              x: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
              y: [12, 18, 22, 25],
              type: 'bar',
              marker: { color: '#b7f5d6' },
            },
          ],
          layout: {
            title: 'Ejercicios logrados por semana',
            xaxis: { title: 'Semana' },
            yaxis: { title: 'Ejercicios' },
          },
        },
      },
    ],
    checkpoint: {
      questions: [
        {
          id: 'm4-q1',
          stem: 'Un almacén vende 18 cajas de 6 cuadernos cada una. ¿Cuántos cuadernos entrega en total?',
          options: [
            { key: 'A', label: '96' },
            { key: 'B', label: '108' },
            { key: 'C', label: '114' },
            { key: 'D', label: '120' },
          ],
          correct: 'B',
        },
        {
          id: 'm4-q2',
          stem: 'Para llegar a 500 minutos de práctica, llevas 320 minutos acumulados. ¿Cuántos minutos faltan?',
          options: [
            { key: 'A', label: '120' },
            { key: 'B', label: '160' },
            { key: 'C', label: '180' },
            { key: 'D', label: '200' },
          ],
          correct: 'B',
        },
      ],
    },
  },
  {
    title: 'Módulo 5: Estadística básica',
    description: 'Interpreta tablas y gráficos sencillos para describir tendencias y variabilidad.',
    sections: [
      {
        heading: 'Recordatorio esencial',
        body: [
          'La media indica el valor promedio, la mediana señala el punto central y la moda el valor más frecuente.',
          { callout: 'Usá la media cuando no haya valores extremos que puedan distorsionar el resultado.' },
        ],
      },
      {
        heading: 'Caso aplicado',
        body: [
          'Analiza los minutos diarios dedicados a la plataforma: 20, 35, 25, 40 y 30 minutos. Calcula la media y la mediana.',
          { math: '\\text{Media} = \\frac{20+35+25+40+30}{5} = 30' },
          { callout: 'La mediana también es 30 (valor central al ordenar la serie).' },
        ],
      },
      {
        heading: 'Visualización',
        body: ['Observa el histograma con la distribución de puntajes de un mini test.'],
        visualization: {
          type: 'plotly',
          data: [
            {
              x: [10, 12, 15, 16, 18, 20],
              y: [2, 5, 12, 9, 4, 1],
              type: 'bar',
              marker: { color: '#38ef7d' },
            },
          ],
          layout: {
            title: 'Distribución de puntajes',
            xaxis: { title: 'Puntaje' },
            yaxis: { title: 'Frecuencia' },
          },
        },
      },
    ],
    checkpoint: {
      questions: [
        {
          id: 'm5-q1',
          stem: 'Los puntajes 12, 14, 15, 19 tienen media 15. ¿Cuál es la mediana?',
          options: [
            { key: 'A', label: '14.5' },
            { key: 'B', label: '15' },
            { key: 'C', label: '16' },
            { key: 'D', label: '12' },
          ],
          correct: 'A',
        },
        {
          id: 'm5-q2',
          stem: 'Si el valor extremo 25 se elimina de una lista, ¿qué medida cambia menos: media o mediana?',
          options: [
            { key: 'A', label: 'Media' },
            { key: 'B', label: 'Mediana' },
            { key: 'C', label: 'Ambas cambian por igual' },
            { key: 'D', label: 'Ninguna cambia' },
          ],
          correct: 'B',
        },
      ],
    },
  },
  {
    title: 'Módulo 6: Geometría cotidiana',
    description: 'Calculá perímetros, áreas y volúmenes en contextos de diseño, construcción o empaquetado.',
    sections: [
      {
        heading: 'Recordatorio conceptual',
        body: [
          'El perímetro suma los lados externos, el área cuenta las unidades cuadradas y el volumen mide el espacio ocupado.',
          { math: 'A_{rectángulo} = base \\times altura' },
          { math: 'V_{prisma} = área_{base} \\times altura' },
        ],
      },
      {
        heading: 'Ejemplo aplicado',
        body: [
          'Diseña una jardinera rectangular de 2.4 m por 1.2 m. Calculá el área a cubrir con tierra nutritiva.',
          { math: 'A = 2.4 \\times 1.2 = 2.88\\text{ m}^2' },
          { callout: 'Prepará un 10% extra por desperdicio: agrega 0.29 m² adicionales.' },
        ],
      },
      {
        heading: 'Visualización',
        body: ['Analiza cómo varía la superficie disponible al modificar la longitud manteniendo el ancho fijo.'],
        visualization: {
          type: 'plotly',
          data: [
            {
              x: [1, 1.5, 2, 2.5, 3],
              y: [1.2, 1.8, 2.4, 3, 3.6],
              type: 'scatter',
              mode: 'lines+markers',
              marker: { color: '#4acbb2' },
            },
          ],
          layout: {
            title: 'Área según longitud (ancho fijo = 1.2 m)',
            xaxis: { title: 'Longitud (m)' },
            yaxis: { title: 'Área (m²)' },
          },
        },
      },
    ],
    checkpoint: {
      questions: [
        {
          id: 'm6-q1',
          stem: 'Un depósito cúbico de 1.5 m de arista. ¿Cuál es su volumen?',
          options: [
            { key: 'A', label: '2.25 m³' },
            { key: 'B', label: '3.38 m³' },
            { key: 'C', label: '4.5 m³' },
            { key: 'D', label: '5.06 m³' },
          ],
          correct: 'B',
        },
        {
          id: 'm6-q2',
          stem: 'Una cancha rectangular mide 18 m por 32 m. ¿Cuál es su perímetro?',
          options: [
            { key: 'A', label: '80 m' },
            { key: 'B', label: '88 m' },
            { key: 'C', label: '100 m' },
            { key: 'D', label: '120 m' },
          ],
          correct: 'B',
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
