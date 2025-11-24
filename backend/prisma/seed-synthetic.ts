/**
 * seed-synthetic.ts
 *
 * Genera datos sintéticos realistas para el estudio de tesis:
 * "Impacto de una plataforma educativa basada en IA en el aprendizaje
 * autónomo de matemáticas en jóvenes y adultos de Los Olivos, Lima, 2025"
 *
 * Diseño: Cuasi-experimental GE vs GC, pretest-postest, ANCOVA
 *
 * Patrones estadísticos:
 * - GE y GC similares en pretest
 * - GE > GC en postest con efecto moderado (d ≈ 0.5)
 * - Correlaciones positivas: uso ↔ ganancia, uso ↔ autonomía/motivación
 * - Infraestructura baja → menos uso → menor ganancia
 */

import {
  PrismaClient,
  Gender,
  EducationLevel,
  MathLevel,
  Device,
  InternetConnection,
  AssignmentGroup,
  AssignmentMethod,
  MessageType,
  EventType,
  PracticeType,
  PracticeItemStatus,
  SurveyInstrument,
  SurveyTimepoint,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================================
// DATOS PERUANOS REALISTAS
// ============================================================================

const APELLIDOS = [
  'García', 'Flores', 'Rodríguez', 'López', 'Sánchez', 'Díaz', 'Ramírez', 'Gonzales',
  'Gómez', 'Castillo', 'Chávez', 'Torres', 'Vásquez', 'Ramos', 'Fernández', 'Rojas',
  'Moreno', 'Romero', 'Herrera', 'Medina', 'Salazar', 'Cruz', 'Aguilar', 'Paredes',
  'Vega', 'Campos', 'Castro', 'Espinoza', 'Núñez', 'Bravo', 'Valverde', 'Mejía',
  'Navarro', 'Palomino', 'Cárdenas', 'León', 'Huamán', 'Quispe', 'Mamani', 'Huamaní',
  'Villanueva', 'Mercado', 'Córdova', 'Lozano', 'Cabrera', 'Montoya', 'Morales',
  'Valenzuela', 'Fuentes', 'Benavides'
];

const NOMBRES_FEMENINOS = [
  'María', 'Carmen', 'Ana', 'Rosa', 'Patricia', 'Claudia', 'Elizabeth', 'Sandra',
  'Daniela', 'Mariana', 'Gabriela', 'Andrea', 'Lucía', 'Paola', 'Karina', 'Mónica',
  'Verónica', 'Silvia', 'Yolanda', 'Liliana', 'Jessica', 'Lorena', 'Roxana', 'Brenda',
  'Alejandra', 'Cecilia', 'Fiorella', 'Johanna', 'Katherine', 'Melissa', 'Pilar',
  'Gladys', 'Juliana', 'Vanessa', 'Fernanda', 'Isabel', 'Teresa', 'Jimena', 'Tatiana',
  'Nelly', 'Sonia', 'Inés', 'Amparo', 'Milagros', 'Estefanía', 'Mirella', 'Luz',
  'Rocío', 'Lidia', 'Magaly'
];

const NOMBRES_MASCULINOS = [
  'Juan', 'Carlos', 'Luis', 'José', 'Miguel', 'Jorge', 'David', 'Pedro', 'Alberto',
  'Ricardo', 'Fernando', 'Diego', 'Andrés', 'Daniel', 'Francisco', 'Roberto', 'Ángel',
  'Raúl', 'Julio', 'Henry', 'Víctor', 'Edwin', 'César', 'Marco', 'Martín', 'Ernesto',
  'Alejandro', 'Gonzalo', 'Hugo', 'Cristian', 'Kevin', 'Bruno', 'Renato', 'Paolo',
  'Javier', 'Nicolás', 'Sebastián', 'Mauricio', 'Erick', 'Omar', 'Jaime', 'Rodrigo',
  'Adrián', 'Alonso', 'José Luis', 'Juan Carlos', 'Luis Alberto', 'Jorge Luis',
  'Juan José', 'Carlos Alberto'
];

const DISTRITOS = [
  { nombre: 'Los Olivos', peso: 0.35 },
  { nombre: 'San Martín de Porres', peso: 0.15 },
  { nombre: 'Independencia', peso: 0.12 },
  { nombre: 'Comas', peso: 0.12 },
  { nombre: 'San Juan de Lurigancho', peso: 0.10 },
  { nombre: 'Puente Piedra', peso: 0.06 },
  { nombre: 'Carabayllo', peso: 0.05 },
  { nombre: 'Rímac', peso: 0.03 },
  { nombre: 'Cercado de Lima', peso: 0.02 },
];

const DOMINIOS_EMAIL = ['gmail.com', 'hotmail.com', 'outlook.com'];

// ============================================================================
// UTILIDADES ESTADÍSTICAS
// ============================================================================

/** Distribución normal (Box-Muller) */
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Random integer in range [min, max] */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick random item from array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Pick with weights */
function pickWeighted<T extends { peso: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.peso, 0);
  let random = Math.random() * total;
  for (const item of items) {
    random -= item.peso;
    if (random <= 0) return item;
  }
  return items[items.length - 1]!;
}

/** Normaliza texto para email (quita acentos, espacios, etc.) */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ============================================================================
// GENERADORES
// ============================================================================

function generatePerson(index: number): {
  firstName: string;
  lastName: string;
  gender: Gender;
  email: string;
  age: number;
  district: string;
  educationLevel: EducationLevel;
} {
  const isFemale = Math.random() < 0.52; // Ligeramente más mujeres
  const gender = isFemale ? Gender.female : Gender.male;
  const firstName = pick(isFemale ? NOMBRES_FEMENINOS : NOMBRES_MASCULINOS);
  const apellido1 = pick(APELLIDOS);
  const apellido2 = pick(APELLIDOS);
  const lastName = `${apellido1} ${apellido2}`;

  const age = clamp(Math.round(randomNormal(28, 8)), 18, 55);
  const district = pickWeighted(DISTRITOS).nombre;

  // Educación: más universitarios si son más jóvenes
  const probUniversity = age < 30 ? 0.55 : 0.35;
  const educationLevel = Math.random() < probUniversity
    ? EducationLevel.university
    : (Math.random() < 0.85 ? EducationLevel.high_school : EducationLevel.other);

  // Email realista con variaciones
  const emailPatterns = [
    () => `${normalize(firstName)}.${normalize(apellido1)}${randInt(1, 99)}`,
    () => `${normalize(firstName)}${normalize(apellido1).slice(0, 3)}${age}`,
    () => `${normalize(firstName).slice(0, 1)}_${normalize(apellido1)}${randInt(10, 99)}`,
    () => `${normalize(firstName)}${randInt(80, 99)}_${normalize(apellido1).slice(0, 4)}`,
    () => `${normalize(firstName).slice(0, 3)}${normalize(apellido1)}${2025 - age}`,
    () => `${normalize(apellido1)}.${normalize(firstName).slice(0, 3)}${randInt(1, 50)}`,
    () => `${normalize(firstName)}_${randInt(100, 999)}`,
    () => `${normalize(firstName)}${normalize(apellido1.slice(0, 2))}${randInt(1, 9)}${randInt(1, 9)}`,
  ];

  const emailBase = pick(emailPatterns)();
  const domain = pick(DOMINIOS_EMAIL);
  const email = `${emailBase}@${domain}`;

  return { firstName, lastName, gender, email, age, district, educationLevel };
}

/** Genera fecha en las últimas N semanas */
function randomDateInWeeks(weeksAgo: number, offsetDays: number = 0): Date {
  const now = new Date();
  const startMs = now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000;
  const endMs = now.getTime() - offsetDays * 24 * 60 * 60 * 1000;
  const randomMs = startMs + Math.random() * (endMs - startMs);
  const date = new Date(randomMs);

  // Horario típico de estudio (8:00 - 22:00)
  date.setHours(randInt(8, 22), randInt(0, 59), randInt(0, 59), 0);
  return date;
}

// ============================================================================
// PARÁMETROS DEL ESTUDIO
// ============================================================================

const CONFIG = {
  totalUsers: 60,

  // Distribución de trayectorias
  completeFlowPercent: 0.67,      // 67% completa todo el flujo
  pretestOnlyPercent: 0.15,       // 15% solo pretest (abandono temprano)
  noPosTestPercent: 0.18,         // 18% práctica sin postest

  // Balance GE/GC
  gePercent: 0.52,                // ~52% GE, ~48% GC

  // Parámetros de assessment (escala 0-24 items)
  pretest: {
    mean: 10,                     // Media pretest para ambos grupos
    stdDev: 3,                    // Desviación estándar
  },

  // Mejora GE vs GC (efecto d ≈ 0.5)
  improvement: {
    ge: { mean: 5.5, stdDev: 2.5 },   // GE: mejora promedio +5.5 puntos
    gc: { mean: 2.0, stdDev: 2.0 },   // GC: mejora promedio +2 puntos
  },

  // Sesiones de práctica
  sessions: {
    minCompleteFlow: 3,
    maxCompleteFlow: 8,
    minPartialFlow: 1,
    maxPartialFlow: 3,
    exercisesPerSession: { min: 4, max: 12 },
    minutesPerSession: { min: 15, max: 45 },
  },

  // Encuestas (escala Likert 1-5)
  surveys: {
    autonomia: { baseMean: 3.2, baseStdDev: 0.7, usageBonus: 0.15 },
    motivacion: { baseMean: 3.4, baseStdDev: 0.6, usageBonus: 0.12 },
    tam: {
      utilidad: { mean: 3.8, stdDev: 0.6 },
      facilidad: { mean: 3.6, stdDev: 0.7 },
    },
  },

  // Infraestructura afecta uso
  infraImpact: {
    low: { sessionMultiplier: 0.5, accuracyPenalty: -0.1 },
    medium: { sessionMultiplier: 0.8, accuracyPenalty: -0.03 },
    high: { sessionMultiplier: 1.0, accuracyPenalty: 0 },
  },
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function generateSyntheticData() {
  console.log('🚀 Generando datos sintéticos para SPSS/ANCOVA...\n');
  console.log('📊 Parámetros del estudio:');
  console.log(`   - Total usuarios: ${CONFIG.totalUsers}`);
  console.log(`   - GE ~${Math.round(CONFIG.gePercent * 100)}%, GC ~${Math.round((1 - CONFIG.gePercent) * 100)}%`);
  console.log(`   - Pretest mean: ${CONFIG.pretest.mean}, SD: ${CONFIG.pretest.stdDev}`);
  console.log(`   - Mejora GE: +${CONFIG.improvement.ge.mean} (SD ${CONFIG.improvement.ge.stdDev})`);
  console.log(`   - Mejora GC: +${CONFIG.improvement.gc.mean} (SD ${CONFIG.improvement.gc.stdDev})`);
  console.log('');

  // Verificar items existentes
  const pretestItems = await prisma.assessmentItem.findMany({ where: { test_version: 'v1' } });
  const posttestItems = await prisma.assessmentItem.findMany({ where: { test_version: 'exit_v1' } });
  const autonomiaItems = await prisma.surveyItem.findMany({ where: { instrument: 'autonomia', version: 'v1' } });
  const motivacionItems = await prisma.surveyItem.findMany({ where: { instrument: 'motivacion', version: 'v1' } });
  const tamItems = await prisma.surveyItem.findMany({ where: { instrument: 'tam', version: 'v1' } });

  if (pretestItems.length === 0 || posttestItems.length === 0) {
    console.error('❌ No hay items de assessment. Ejecuta: npx prisma db seed');
    process.exit(1);
  }

  console.log(`📝 Items encontrados:`);
  console.log(`   - Pretest: ${pretestItems.length}, Postest: ${posttestItems.length}`);
  console.log(`   - Autonomía: ${autonomiaItems.length}, Motivación: ${motivacionItems.length}, TAM: ${tamItems.length}\n`);

  const passwordHash = await bcrypt.hash('password123', 10);
  const maxItems = Math.min(pretestItems.length, posttestItems.length);

  // Calcular distribución de usuarios
  const numComplete = Math.round(CONFIG.totalUsers * CONFIG.completeFlowPercent);
  const numPretestOnly = Math.round(CONFIG.totalUsers * CONFIG.pretestOnlyPercent);
  const numNoPosttest = CONFIG.totalUsers - numComplete - numPretestOnly;

  // Contadores para balance GE/GC
  let geCount = 0;
  let gcCount = 0;
  const targetGE = Math.round(CONFIG.totalUsers * CONFIG.gePercent);

  // Estadísticas para verificación
  const stats = {
    ge: { preScores: [] as number[], postScores: [] as number[], n: 0 },
    gc: { preScores: [] as number[], postScores: [] as number[], n: 0 },
  };

  for (let i = 0; i < CONFIG.totalUsers; i++) {
    // Determinar trayectoria
    let trajectory: 'complete' | 'pretest_only' | 'no_posttest';
    if (i < numComplete) {
      trajectory = 'complete';
    } else if (i < numComplete + numPretestOnly) {
      trajectory = 'pretest_only';
    } else {
      trajectory = 'no_posttest';
    }

    // Asignar grupo balanceando
    let group: AssignmentGroup;
    if (geCount < targetGE && (gcCount >= CONFIG.totalUsers - targetGE || Math.random() < 0.5)) {
      group = AssignmentGroup.GE;
      geCount++;
    } else {
      group = AssignmentGroup.GC;
      gcCount++;
    }

    // Generar persona
    const person = generatePerson(i);
    const registrationDate = randomDateInWeeks(10, Math.floor(i / 6));

    console.log(`👤 ${i + 1}/${CONFIG.totalUsers}: ${person.firstName} ${person.lastName.split(' ')[0]} (${group}, ${trajectory})`);

    // ========== CREAR USUARIO ==========
    const user = await prisma.user.create({
      data: {
        first_name: person.firstName,
        last_name: person.lastName,
        email: person.email,
        password_hash: passwordHash,
        age: person.age,
        gender: person.gender,
        education_level: person.educationLevel,
        math_level: Math.random() < 0.6 ? MathLevel.beginner : MathLevel.intermediate,
        goal: `Mejorar en matemáticas - ${person.district}`,
        created_at: registrationDate,
      },
    });

    // ========== CONSENTIMIENTO ==========
    await prisma.consent.create({
      data: {
        user_id: user.user_id,
        accepted: true,
        document_version: 'v1.0',
        accepted_at: new Date(registrationDate.getTime() + 3 * 60 * 1000),
      },
    });

    // ========== ASIGNACIÓN A GRUPO ==========
    await prisma.assignment.create({
      data: {
        user_id: user.user_id,
        group,
        method: AssignmentMethod.azar,
        seed: `seed_${Date.now()}_${i}`,
        assigned_at: new Date(registrationDate.getTime() + 5 * 60 * 1000),
      },
    });

    // ========== FEATURE FLAGS ==========
    await prisma.featureFlag.create({
      data: {
        user_id: user.user_id,
        chatbot: group === AssignmentGroup.GE,
        adaptativo: group === AssignmentGroup.GE,
      },
    });

    // ========== INFRAESTRUCTURA ==========
    // Distribución: 50% high, 35% medium, 15% low
    const infraRand = Math.random();
    const internetConnection = infraRand < 0.15
      ? InternetConnection.low
      : (infraRand < 0.50 ? InternetConnection.medium : InternetConnection.high);

    const device = Math.random() < 0.45
      ? Device.mobile
      : (Math.random() < 0.7 ? Device.PC : Device.tablet);

    await prisma.infrastructure.create({
      data: {
        user_id: user.user_id,
        device,
        internet_connection: internetConnection,
        observations: person.district,
      },
    });

    const infraImpact = CONFIG.infraImpact[internetConnection];

    // ========== PRETEST ==========
    const pretestDate = new Date(registrationDate.getTime() + 15 * 60 * 1000);

    // Score con ligera variación por infraestructura
    let pretestScore = Math.round(randomNormal(CONFIG.pretest.mean, CONFIG.pretest.stdDev));
    pretestScore = clamp(pretestScore + (internetConnection === 'low' ? -1 : 0), 3, maxItems - 3);

    const pretest = await prisma.assessment.create({
      data: {
        user_id: user.user_id,
        assessment_type: 'pretest',
        test_version: 'v1',
        total_score: pretestScore,
        started_at: pretestDate,
        finished_at: new Date(pretestDate.getTime() + randInt(18, 35) * 60 * 1000),
      },
    });

    // Respuestas del pretest
    const shuffledPretest = [...pretestItems].sort(() => Math.random() - 0.5);
    for (let j = 0; j < pretestItems.length; j++) {
      const item = shuffledPretest[j]!;
      const isCorrect = j < pretestScore;
      await prisma.assessmentResponse.create({
        data: {
          assessment_id: pretest.assessment_id,
          item_id: item.item_id,
          answer: isCorrect ? item.correct_key : pick(['A', 'B', 'C', 'D'].filter(k => k !== item.correct_key)),
          is_correct: isCorrect,
        },
      });
    }

    // Guardar para estadísticas
    const groupStats = group === AssignmentGroup.GE ? stats.ge : stats.gc;
    groupStats.preScores.push(pretestScore);

    if (trajectory === 'pretest_only') {
      continue;
    }

    // ========== SESIONES DE PRÁCTICA ==========
    const sessionConfig = trajectory === 'complete'
      ? { min: CONFIG.sessions.minCompleteFlow, max: CONFIG.sessions.maxCompleteFlow }
      : { min: CONFIG.sessions.minPartialFlow, max: CONFIG.sessions.maxPartialFlow };

    let numSessions = randInt(sessionConfig.min, sessionConfig.max);
    numSessions = Math.max(1, Math.round(numSessions * infraImpact.sessionMultiplier));

    let totalExercises = 0;
    let totalCorrect = 0;
    let totalMinutes = 0;
    let lastSessionEnd = new Date(pretestDate.getTime() + 24 * 60 * 60 * 1000);

    for (let s = 0; s < numSessions; s++) {
      const sessionStart = new Date(lastSessionEnd.getTime() + randInt(12, 72) * 60 * 60 * 1000);
      const sessionMinutes = randInt(CONFIG.sessions.minutesPerSession.min, CONFIG.sessions.minutesPerSession.max);
      const sessionEnd = new Date(sessionStart.getTime() + sessionMinutes * 60 * 1000);
      totalMinutes += sessionMinutes;

      const session = await prisma.session.create({
        data: {
          user_id: user.user_id,
          start_time: sessionStart,
          end_time: sessionEnd,
          total_time_seconds: sessionMinutes * 60,
          device,
        },
      });

      // Evento inicio sesión
      await prisma.event.create({
        data: {
          user_id: user.user_id,
          event_type: EventType.session_start,
          metadata: { session_id: session.session_id, duration_seconds: sessionMinutes * 60 },
          occurred_at: sessionStart,
        },
      });

      // Ejercicios en la sesión
      const numExercises = randInt(CONFIG.sessions.exercisesPerSession.min, CONFIG.sessions.exercisesPerSession.max);
      let correctInSession = 0;

      // Precisión mejora con las sesiones y es mayor para GE
      const baseAccuracy = 0.45 + (s * 0.04) + (group === AssignmentGroup.GE ? 0.08 : 0);
      const accuracy = clamp(baseAccuracy + infraImpact.accuracyPenalty, 0.25, 0.85);

      for (let e = 0; e < numExercises; e++) {
        const exerciseTime = new Date(sessionStart.getTime() + (e + 1) * (sessionMinutes * 60 * 1000 / (numExercises + 1)));
        const isCorrect = Math.random() < accuracy;

        if (isCorrect) {
          correctInSession++;
          totalCorrect++;
        }
        totalExercises++;

        const topic = pick(['proporciones', 'algebra', 'porcentajes', 'aritmetica', 'ecuaciones']);

        const practiceItem = await prisma.practiceGenerated.create({
          data: {
            user_id: user.user_id,
            session_id: `session_${session.session_id}`,
            topic,
            difficulty: pick(['basic', 'intermediate']),
            item_json: { stem: `Ejercicio ${topic}`, options: ['A', 'B', 'C', 'D'], correct_key: 'A' },
            status: PracticeItemStatus.completed,
            created_at: exerciseTime,
            consumed_at: exerciseTime,
          },
        });

        await prisma.practiceAttempt.create({
          data: {
            practice_generated_id: practiceItem.practice_generated_id,
            user_id: user.user_id,
            user_answer: isCorrect ? 'A' : pick(['B', 'C', 'D']),
            correct: isCorrect,
            explanation: isCorrect ? 'Correcto' : 'Revisa el procedimiento',
            domain: topic,
            competency: 'general',
            created_at: exerciseTime,
          },
        });

        await prisma.event.create({
          data: {
            user_id: user.user_id,
            event_type: isCorrect ? EventType.correct : EventType.incorrect,
            metadata: { practice_id: practiceItem.practice_generated_id },
            occurred_at: exerciseTime,
          },
        });

        // Hints para GE cuando fallan
        if (group === AssignmentGroup.GE && !isCorrect && Math.random() < 0.4) {
          await prisma.aIFeedback.create({
            data: {
              user_id: user.user_id,
              ai_message: 'Recuerda aplicar el procedimiento paso a paso.',
              message_type: MessageType.hint,
              prompt_hash: `hint_${Date.now()}`,
              token_count: randInt(30, 80),
              created_at: exerciseTime,
            },
          });
        }
      }

      // Resumen de sesión
      await prisma.practiceSummary.create({
        data: {
          user_id: user.user_id,
          practice_type: PracticeType.exercise,
          correct_count: correctInSession,
          attempt_count: numExercises,
          duration_seconds: sessionMinutes * 60,
          occurred_at: sessionStart,
        },
      });

      // Evento fin sesión
      await prisma.event.create({
        data: {
          user_id: user.user_id,
          event_type: EventType.session_end,
          metadata: { session_id: session.session_id },
          occurred_at: sessionEnd,
        },
      });

      lastSessionEnd = sessionEnd;
    }

    if (trajectory === 'no_posttest') {
      continue;
    }

    // ========== POSTEST ==========
    const posttestDate = new Date(lastSessionEnd.getTime() + randInt(24, 72) * 60 * 60 * 1000);

    // Mejora diferenciada por grupo
    const improvementConfig = group === AssignmentGroup.GE
      ? CONFIG.improvement.ge
      : CONFIG.improvement.gc;

    // Bonus por uso (más sesiones/ejercicios = más mejora)
    const usageBonus = Math.min(2, (totalExercises / 30) + (numSessions / 5));

    let improvement = randomNormal(improvementConfig.mean, improvementConfig.stdDev);
    improvement = improvement + (group === AssignmentGroup.GE ? usageBonus * 0.5 : usageBonus * 0.2);

    // Penalización por mala infraestructura
    if (internetConnection === 'low') improvement *= 0.7;

    let posttestScore = Math.round(pretestScore + improvement);
    posttestScore = clamp(posttestScore, pretestScore - 1, maxItems); // No puede bajar más de 1 punto

    const posttest = await prisma.assessment.create({
      data: {
        user_id: user.user_id,
        assessment_type: 'posttest',
        test_version: 'exit_v1',
        total_score: posttestScore,
        started_at: posttestDate,
        finished_at: new Date(posttestDate.getTime() + randInt(18, 35) * 60 * 1000),
      },
    });

    // Respuestas del postest
    const shuffledPosttest = [...posttestItems].sort(() => Math.random() - 0.5);
    for (let j = 0; j < posttestItems.length; j++) {
      const item = shuffledPosttest[j]!;
      const isCorrect = j < posttestScore;
      await prisma.assessmentResponse.create({
        data: {
          assessment_id: posttest.assessment_id,
          item_id: item.item_id,
          answer: isCorrect ? item.correct_key : pick(['A', 'B', 'C', 'D'].filter(k => k !== item.correct_key)),
          is_correct: isCorrect,
        },
      });
    }

    groupStats.postScores.push(posttestScore);
    groupStats.n++;

    // ========== ENCUESTAS ==========
    const surveyDate = new Date(posttestDate.getTime() + 15 * 60 * 1000);

    // Factor de uso normalizado (0-1)
    const usageFactor = Math.min(1, (totalExercises / 50 + numSessions / 6) / 2);

    // Autonomía (pre y post)
    if (autonomiaItems.length > 0) {
      for (const timepoint of [SurveyTimepoint.pre, SurveyTimepoint.post] as const) {
        const submission = await prisma.surveySubmission.create({
          data: {
            user_id: user.user_id,
            instrument: SurveyInstrument.autonomia,
            version: 'v1',
            timepoint,
            completed: true,
            submitted_at: timepoint === 'pre' ? pretestDate : surveyDate,
          },
        });

        const bonus = timepoint === 'post'
          ? usageFactor * CONFIG.surveys.autonomia.usageBonus * (group === AssignmentGroup.GE ? 1.5 : 1)
          : 0;

        for (const item of autonomiaItems) {
          const value = clamp(
            Math.round(randomNormal(CONFIG.surveys.autonomia.baseMean + bonus, CONFIG.surveys.autonomia.baseStdDev)),
            1, 5
          );
          await prisma.surveyResponse.create({
            data: {
              survey_submission_id: submission.survey_submission_id,
              survey_item_id: item.survey_item_id,
              value,
            },
          });
        }
      }
    }

    // Motivación (pre y post)
    if (motivacionItems.length > 0) {
      for (const timepoint of [SurveyTimepoint.pre, SurveyTimepoint.post] as const) {
        const submission = await prisma.surveySubmission.create({
          data: {
            user_id: user.user_id,
            instrument: SurveyInstrument.motivacion,
            version: 'v1',
            timepoint,
            completed: true,
            submitted_at: timepoint === 'pre' ? pretestDate : surveyDate,
          },
        });

        const bonus = timepoint === 'post'
          ? usageFactor * CONFIG.surveys.motivacion.usageBonus * (group === AssignmentGroup.GE ? 1.4 : 1)
          : 0;

        for (const item of motivacionItems) {
          const value = clamp(
            Math.round(randomNormal(CONFIG.surveys.motivacion.baseMean + bonus, CONFIG.surveys.motivacion.baseStdDev)),
            1, 5
          );
          await prisma.surveyResponse.create({
            data: {
              survey_submission_id: submission.survey_submission_id,
              survey_item_id: item.survey_item_id,
              value,
            },
          });
        }
      }
    }

    // TAM (solo post)
    if (tamItems.length > 0) {
      const tamSubmission = await prisma.surveySubmission.create({
        data: {
          user_id: user.user_id,
          instrument: SurveyInstrument.tam,
          version: 'v1',
          timepoint: SurveyTimepoint.post,
          completed: true,
          submitted_at: surveyDate,
        },
      });

      for (const item of tamItems) {
        const isUtilidad = item.subscale === 'utilidad';
        const config = isUtilidad ? CONFIG.surveys.tam.utilidad : CONFIG.surveys.tam.facilidad;

        // TAM más alto para GE y usuarios con más uso
        const geBonus = group === AssignmentGroup.GE ? 0.3 : 0;
        const useBonus = usageFactor * 0.4;

        const value = clamp(
          Math.round(randomNormal(config.mean + geBonus + useBonus, config.stdDev)),
          1, 5
        );

        await prisma.surveyResponse.create({
          data: {
            survey_submission_id: tamSubmission.survey_submission_id,
            survey_item_id: item.survey_item_id,
            value,
          },
        });
      }
    }
  }

  // ========== ESTADÍSTICAS FINALES ==========
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTADÍSTICAS GENERADAS (para verificar en SPSS)');
  console.log('='.repeat(60));

  const calcStats = (arr: number[]) => {
    const n = arr.length;
    if (n === 0) return { n: 0, mean: 0, sd: 0 };
    const mean = arr.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1));
    return { n, mean: mean.toFixed(2), sd: sd.toFixed(2) };
  };

  const gePreStats = calcStats(stats.ge.preScores);
  const gePostStats = calcStats(stats.ge.postScores);
  const gcPreStats = calcStats(stats.gc.preScores);
  const gcPostStats = calcStats(stats.gc.postScores);

  console.log(`\n📈 GRUPO EXPERIMENTAL (GE):`);
  console.log(`   Pretest:  n=${gePreStats.n}, M=${gePreStats.mean}, SD=${gePreStats.sd}`);
  console.log(`   Postest:  n=${gePostStats.n}, M=${gePostStats.mean}, SD=${gePostStats.sd}`);
  console.log(`   Ganancia: M=${(Number(gePostStats.mean) - Number(gePreStats.mean)).toFixed(2)}`);

  console.log(`\n📉 GRUPO CONTROL (GC):`);
  console.log(`   Pretest:  n=${gcPreStats.n}, M=${gcPreStats.mean}, SD=${gcPreStats.sd}`);
  console.log(`   Postest:  n=${gcPostStats.n}, M=${gcPostStats.mean}, SD=${gcPostStats.sd}`);
  console.log(`   Ganancia: M=${(Number(gcPostStats.mean) - Number(gcPreStats.mean)).toFixed(2)}`);

  // Cohen's d aproximado
  const pooledSD = Math.sqrt(
    ((Number(gePostStats.sd) ** 2) + (Number(gcPostStats.sd) ** 2)) / 2
  );
  const cohenD = (Number(gePostStats.mean) - Number(gcPostStats.mean)) / pooledSD;
  console.log(`\n🎯 Diferencia GE-GC postest: ${(Number(gePostStats.mean) - Number(gcPostStats.mean)).toFixed(2)}`);
  console.log(`   Cohen's d estimado: ${cohenD.toFixed(2)}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Datos sintéticos generados exitosamente');
  console.log(`   Total usuarios: ${CONFIG.totalUsers}`);
  console.log(`   GE: ${geCount}, GC: ${gcCount}`);
  console.log(`   Con postest: ${stats.ge.n + stats.gc.n}`);
  console.log('='.repeat(60));
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

generateSyntheticData()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
