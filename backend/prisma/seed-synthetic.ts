import { PrismaClient, Gender, EducationLevel, MathLevel, Device, InternetConnection, AssignmentGroup, AssignmentMethod, MessageType, EventType, PracticeType, PracticeItemStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Nombres y apellidos peruanos comunes
const firstNames = {
  male: ['Jorge', 'Carlos', 'Luis', 'Miguel', 'José', 'Manuel', 'Ángel', 'Pedro', 'Juan', 'Roberto', 'Francisco', 'Alejandro', 'Fernando', 'Ricardo', 'Antonio', 'Diego', 'Andrés', 'Pablo', 'Martín', 'Raúl', 'Héctor', 'Sergio', 'César', 'Eduardo', 'Daniel'],
  female: ['María', 'Rosa', 'Carmen', 'Ana', 'Isabel', 'Patricia', 'Elena', 'Laura', 'Gabriela', 'Claudia', 'Lucía', 'Sofía', 'Valeria', 'Daniela', 'Andrea', 'Beatriz', 'Paola', 'Natalia', 'Carolina', 'Mónica', 'Silvia', 'Teresa', 'Roxana', 'Julia', 'Fernanda']
};

const lastNames = ['Quispe', 'Huamán', 'Rojas', 'Paredes', 'García', 'López', 'Pérez', 'Torres', 'Flores', 'Vargas', 'Chávez', 'Mendoza', 'Sánchez', 'Ramírez', 'Castro', 'Ruiz', 'Díaz', 'Morales', 'Cruz', 'Gutiérrez', 'Ramos', 'Herrera', 'Medina', 'Castillo', 'Vega', 'Romero', 'Álvarez', 'Fernández', 'Reyes', 'Ayala'];

const distritos = ['Los Olivos', 'San Juan de Lurigancho', 'San Martin de Porres', 'Comas', 'Villa El Salvador', 'Villa María del Triunfo', 'San Juan de Miraflores', 'Ate', 'Independencia', 'Callao'];

// Generar fecha aleatoria en los últimos 20 días
function randomDateInLast20Days(offsetDays: number = 0): Date {
  const now = new Date();
  const start = new Date(now.getTime() - (20 - offsetDays) * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - offsetDays * 24 * 60 * 60 * 1000);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const date = new Date(randomTime);

  // Ajustar a horario de estudio típico (08:00 - 23:00)
  const hour = 8 + Math.floor(Math.random() * 15);
  const minute = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, 0, 0);

  return date;
}

// Generar un nombre completo aleatorio
function randomFullName(): { firstName: string; lastName: string; gender: Gender } {
  const gender = Math.random() > 0.5 ? Gender.male : Gender.female;
  const firstName = firstNames[gender][Math.floor(Math.random() * firstNames[gender].length)];
  const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)];
  const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)];

  return {
    firstName,
    lastName: `${lastName1} ${lastName2}`,
    gender
  };
}

// Generar email único
function generateEmail(firstName: string, lastName: string, index: number): string {
  const cleanFirstName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanLastName = lastName.split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `${cleanFirstName}.${cleanLastName}${index}@example.com`;
}

async function generateSyntheticData() {
  console.log('🚀 Generando datos sintéticos...\n');

  const totalUsers = 65;
  const completeFlowUsers = 42; // 65%
  const pretestOnlyUsers = 12; // 18%
  const practiceWithoutPosttestUsers = 11; // 17%

  // Obtener items de assessment existentes
  const pretestItems = await prisma.assessmentItem.findMany({
    where: { test_version: 'v1' }
  });

  const posttestItems = await prisma.assessmentItem.findMany({
    where: { test_version: 'exit_v1' }
  });

  const surveyItems = await prisma.surveyItem.findMany({
    where: { instrument: 'tam', version: 'v1' }
  });

  if (pretestItems.length === 0 || posttestItems.length === 0) {
    console.error('❌ No hay items de assessment en la base de datos. Ejecuta primero: npm run seed');
    process.exit(1);
  }

  console.log(`📝 Items encontrados: ${pretestItems.length} pretest, ${posttestItems.length} postest, ${surveyItems.length} survey\n`);

  const passwordHash = await bcrypt.hash('password123', 10);

  for (let i = 0; i < totalUsers; i++) {
    const { firstName, lastName, gender } = randomFullName();
    const email = generateEmail(firstName, lastName, i);
    const age = 18 + Math.floor(Math.random() * 38); // 18-55 años
    const educationLevel = Math.random() > 0.6 ? EducationLevel.university : EducationLevel.high_school;
    const mathLevel = Math.random() > 0.7 ? MathLevel.intermediate : (Math.random() > 0.5 ? MathLevel.beginner : MathLevel.advanced);
    const district = distritos[Math.floor(Math.random() * distritos.length)];

    // Determinar tipo de trayectoria
    let trajectory: 'complete' | 'pretest_only' | 'practice_without_posttest';
    if (i < completeFlowUsers) {
      trajectory = 'complete';
    } else if (i < completeFlowUsers + pretestOnlyUsers) {
      trajectory = 'pretest_only';
    } else {
      trajectory = 'practice_without_posttest';
    }

    // Fecha de registro (inicio del flujo)
    const registrationDate = randomDateInLast20Days(19 - Math.floor(i / 4)); // Distribuir en el tiempo

    console.log(`👤 Usuario ${i + 1}/${totalUsers}: ${firstName} ${lastName} (${trajectory})`);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: passwordHash,
        age,
        gender,
        education_level: educationLevel,
        math_level: mathLevel,
        goal: `Mejorar mis habilidades en matemáticas - ${district}`,
        created_at: registrationDate
      }
    });

    // Consentimiento
    await prisma.consent.create({
      data: {
        user_id: user.user_id,
        accepted: true,
        document_version: 'v1.0',
        accepted_at: new Date(registrationDate.getTime() + 2 * 60 * 1000) // 2 minutos después
      }
    });

    // Asignación a grupo (50% GE, 50% GC)
    const group = i % 2 === 0 ? AssignmentGroup.GE : AssignmentGroup.GC;
    await prisma.assignment.create({
      data: {
        user_id: user.user_id,
        group,
        method: AssignmentMethod.azar,
        seed: `seed_${i}`,
        assigned_at: new Date(registrationDate.getTime() + 5 * 60 * 1000)
      }
    });

    // Feature flags según grupo
    await prisma.featureFlag.create({
      data: {
        user_id: user.user_id,
        chatbot: group === AssignmentGroup.GE, // Solo GE tiene chatbot
        adaptativo: true // Todos tienen adaptativo
      }
    });

    // Infraestructura
    const devices: Device[] = [Device.PC, Device.mobile, Device.tablet];
    await prisma.infrastructure.create({
      data: {
        user_id: user.user_id,
        device: devices[Math.floor(Math.random() * devices.length)],
        internet_connection: Math.random() > 0.3 ? InternetConnection.high : InternetConnection.medium,
        observations: null
      }
    });

    // PRETEST
    const pretestDate = new Date(registrationDate.getTime() + 10 * 60 * 1000); // 10 minutos después del registro
    const pretestScore = Math.floor(Math.random() * 8) + 4; // 4-11 puntos (de 23 items)
    const pretestCorrect = Math.min(pretestScore, pretestItems.length);

    const pretest = await prisma.assessment.create({
      data: {
        user_id: user.user_id,
        assessment_type: 'pretest',
        test_version: 'v1',
        total_score: pretestCorrect,
        started_at: pretestDate,
        finished_at: new Date(pretestDate.getTime() + (15 + Math.random() * 20) * 60 * 1000) // 15-35 min
      }
    });

    // Respuestas del pretest
    const shuffledPretestItems = [...pretestItems].sort(() => Math.random() - 0.5);
    for (let j = 0; j < pretestItems.length; j++) {
      const item = shuffledPretestItems[j];
      const isCorrect = j < pretestCorrect;
      const correctKey = item.correct_key;
      const options = ['A', 'B', 'C', 'D'];
      const answer = isCorrect ? correctKey : options.filter(o => o !== correctKey)[Math.floor(Math.random() * 3)];

      await prisma.assessmentResponse.create({
        data: {
          assessment_id: pretest.assessment_id,
          item_id: item.item_id,
          answer,
          is_correct: isCorrect
        }
      });
    }

    if (trajectory === 'pretest_only') {
      continue; // No hacer más nada
    }

    // PRÁCTICA
    const numPracticeSessions = 2 + Math.floor(Math.random() * 3); // 2-4 sesiones (optimizado)
    let lastSessionDate = new Date(pretestDate.getTime() + 24 * 60 * 60 * 1000); // Al día siguiente

    for (let sessionIdx = 0; sessionIdx < numPracticeSessions; sessionIdx++) {
      const sessionStartDate = new Date(lastSessionDate.getTime() + (sessionIdx > 0 ? Math.random() * 2 * 24 * 60 * 60 * 1000 : 0));
      const sessionDurationMinutes = 15 + Math.floor(Math.random() * 25); // 15-40 min (optimizado)
      const sessionEndDate = new Date(sessionStartDate.getTime() + sessionDurationMinutes * 60 * 1000);

      // Sesión
      const session = await prisma.session.create({
        data: {
          user_id: user.user_id,
          start_time: sessionStartDate,
          end_time: sessionEndDate,
          total_time_seconds: sessionDurationMinutes * 60,
          device: devices[Math.floor(Math.random() * devices.length)]
        }
      });

      // Eventos de sesión
      await prisma.event.create({
        data: {
          user_id: user.user_id,
          event_type: EventType.session_start,
          metadata: { session_id: session.session_id },
          occurred_at: sessionStartDate
        }
      });

      // Ejercicios en la sesión (3-8 por sesión, optimizado)
      const numExercises = 3 + Math.floor(Math.random() * 6);
      let correctInSession = 0;
      let currentTime = sessionStartDate;

      for (let ex = 0; ex < numExercises; ex++) {
        // Mejora progresiva: más sesiones = más precisión
        const baseAccuracy = 0.4 + (sessionIdx * 0.05); // Empieza en 40%, sube 5% por sesión
        const accuracy = Math.min(0.85, baseAccuracy + Math.random() * 0.2);
        const isCorrect = Math.random() < accuracy;

        if (isCorrect) correctInSession++;

        const exerciseTime = new Date(currentTime.getTime() + (ex * (sessionDurationMinutes * 60 * 1000) / numExercises));

        // PracticeGenerated
        const practiceItem = await prisma.practiceGenerated.create({
          data: {
            user_id: user.user_id,
            session_id: `session_${session.session_id}`,
            topic: ['proporciones', 'algebra', 'porcentajes', 'aritmetica'][Math.floor(Math.random() * 4)],
            difficulty: ['basic', 'intermediate'][Math.floor(Math.random() * 2)],
            item_json: {
              stem: `Ejercicio de práctica ${ex + 1}`,
              options: [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
              correct_key: 'A'
            },
            status: PracticeItemStatus.completed,
            created_at: exerciseTime,
            consumed_at: exerciseTime
          }
        });

        // PracticeAttempt
        await prisma.practiceAttempt.create({
          data: {
            practice_generated_id: practiceItem.practice_generated_id,
            user_id: user.user_id,
            user_answer: isCorrect ? 'A' : ['B', 'C', 'D'][Math.floor(Math.random() * 3)],
            correct: isCorrect,
            explanation: isCorrect ? 'Correcto' : 'Incorrecto',
            domain: practiceItem.topic,
            competency: 'general',
            created_at: exerciseTime
          }
        });

        // Evento
        await prisma.event.create({
          data: {
            user_id: user.user_id,
            event_type: isCorrect ? EventType.correct : EventType.incorrect,
            metadata: { practice_id: practiceItem.practice_generated_id },
            occurred_at: exerciseTime
          }
        });

        // Si es GE y falló, a veces pide hint
        if (group === AssignmentGroup.GE && !isCorrect && Math.random() > 0.6) {
          await prisma.aIFeedback.create({
            data: {
              user_id: user.user_id,
              activity_id: null,
              ai_message: 'Recuerda revisar la jerarquía de operaciones. Primero las multiplicaciones y divisiones, luego las sumas y restas.',
              message_type: MessageType.hint,
              prompt_hash: `hash_${Date.now()}`,
              token_count: 50 + Math.floor(Math.random() * 100),
              created_at: exerciseTime
            }
          });

          await prisma.event.create({
            data: {
              user_id: user.user_id,
              event_type: EventType.hint,
              metadata: { practice_id: practiceItem.practice_generated_id },
              occurred_at: exerciseTime
            }
          });
        }

        currentTime = new Date(exerciseTime.getTime() + 60 * 1000);
      }

      // PracticeSummary
      await prisma.practiceSummary.create({
        data: {
          user_id: user.user_id,
          practice_type: PracticeType.exercise,
          correct_count: correctInSession,
          attempt_count: numExercises,
          duration_seconds: sessionDurationMinutes * 60,
          occurred_at: sessionStartDate
        }
      });

      await prisma.event.create({
        data: {
          user_id: user.user_id,
          event_type: EventType.session_end,
          metadata: { session_id: session.session_id },
          occurred_at: sessionEndDate
        }
      });

      lastSessionDate = sessionEndDate;
    }

    if (trajectory === 'practice_without_posttest') {
      continue; // No hacer postest
    }

    // POSTEST (solo para flujo completo)
    const posttestDate = new Date(lastSessionDate.getTime() + (1 + Math.random() * 2) * 24 * 60 * 60 * 1000); // 1-3 días después

    // Mejora realista: la mayoría mejora entre 5-30%
    const improvement = Math.random() < 0.85 ? (0.2 + Math.random() * 0.5) : (Math.random() * 0.1); // 85% mejora 20-70%, 15% mejora 0-10%
    const posttestCorrect = Math.min(posttestItems.length, Math.floor(pretestCorrect * (1 + improvement)));

    const posttest = await prisma.assessment.create({
      data: {
        user_id: user.user_id,
        assessment_type: 'posttest',
        test_version: 'exit_v1',
        total_score: posttestCorrect,
        started_at: posttestDate,
        finished_at: new Date(posttestDate.getTime() + (15 + Math.random() * 20) * 60 * 1000)
      }
    });

    // Respuestas del postest
    const shuffledPosttestItems = [...posttestItems].sort(() => Math.random() - 0.5);
    for (let j = 0; j < posttestItems.length; j++) {
      const item = shuffledPosttestItems[j];
      const isCorrect = j < posttestCorrect;
      const correctKey = item.correct_key;
      const options = ['A', 'B', 'C', 'D'];
      const answer = isCorrect ? correctKey : options.filter(o => o !== correctKey)[Math.floor(Math.random() * 3)];

      await prisma.assessmentResponse.create({
        data: {
          assessment_id: posttest.assessment_id,
          item_id: item.item_id,
          answer,
          is_correct: isCorrect
        }
      });
    }

    // ENCUESTA TAM (solo para flujo completo)
    if (surveyItems.length > 0) {
      const surveyDate = new Date(posttestDate.getTime() + 10 * 60 * 1000);
      const surveySubmission = await prisma.surveySubmission.create({
        data: {
          user_id: user.user_id,
          instrument: 'tam',
          version: 'v1',
          timepoint: 'exit',
          completed: true,
          submitted_at: surveyDate
        }
      });

      // Respuestas (1-5, mayoría positivas 4-5)
      for (const item of surveyItems) {
        const value = Math.random() > 0.3 ? (4 + Math.floor(Math.random() * 2)) : (2 + Math.floor(Math.random() * 2)); // 70% responden 4-5, 30% responden 2-3
        await prisma.surveyResponse.create({
          data: {
            survey_submission_id: surveySubmission.survey_submission_id,
            survey_item_id: item.survey_item_id,
            value
          }
        });
      }
    }
  }

  console.log('\n✅ Datos sintéticos generados exitosamente');
  console.log(`\n📊 Resumen:`);
  console.log(`   - Total usuarios: ${totalUsers}`);
  console.log(`   - Flujo completo: ${completeFlowUsers} (${Math.round(completeFlowUsers/totalUsers*100)}%)`);
  console.log(`   - Solo pretest: ${pretestOnlyUsers} (${Math.round(pretestOnlyUsers/totalUsers*100)}%)`);
  console.log(`   - Pretest + práctica: ${practiceWithoutPosttestUsers} (${Math.round(practiceWithoutPosttestUsers/totalUsers*100)}%)`);
  console.log(`   - Distribución: ~50% GE (con chatbot), ~50% GC (sin chatbot)`);
}

generateSyntheticData()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
