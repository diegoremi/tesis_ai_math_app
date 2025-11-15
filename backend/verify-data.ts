import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verificando datos generados...\n');

  // Total usuarios
  const totalUsers = await prisma.user.count();
  console.log(`👥 Total usuarios: ${totalUsers}`);

  // Distribución por grupo
  const geUsers = await prisma.assignment.count({ where: { group: 'GE' } });
  const gcUsers = await prisma.assignment.count({ where: { group: 'GC' } });
  console.log(`\n📊 Distribución por grupo:`);
  console.log(`   - GE (con chatbot): ${geUsers} (${Math.round(geUsers/totalUsers*100)}%)`);
  console.log(`   - GC (sin chatbot): ${gcUsers} (${Math.round(gcUsers/totalUsers*100)}%)`);

  // Assessments
  const pretests = await prisma.assessment.count({ where: { assessment_type: 'pretest' } });
  const posttests = await prisma.assessment.count({ where: { assessment_type: 'posttest' } });
  console.log(`\n📝 Evaluaciones:`);
  console.log(`   - Pretests: ${pretests}`);
  console.log(`   - Posttests: ${posttests}`);
  console.log(`   - Usuarios que completaron flujo: ${posttests}`);

  // Sesiones de práctica
  const totalSessions = await prisma.session.count();
  const totalExercises = await prisma.practiceAttempt.count();
  console.log(`\n💪 Práctica:`);
  console.log(`   - Total sesiones: ${totalSessions}`);
  console.log(`   - Total ejercicios: ${totalExercises}`);
  console.log(`   - Promedio ejercicios/sesión: ${Math.round(totalExercises/totalSessions)}`);

  // Eventos
  const totalEvents = await prisma.event.count();
  console.log(`\n📈 Telemetría:`);
  console.log(`   - Total eventos: ${totalEvents}`);

  // AI Feedback (solo GE)
  const totalFeedback = await prisma.aIFeedback.count();
  console.log(`\n🤖 AI Feedback:`);
  console.log(`   - Total mensajes de tutor: ${totalFeedback}`);

  // Encuestas
  const totalSurveys = await prisma.surveySubmission.count();
  console.log(`\n📋 Encuestas:`);
  console.log(`   - Total encuestas completadas: ${totalSurveys}`);

  // Rango de fechas
  const oldestUser = await prisma.user.findFirst({
    orderBy: { created_at: 'asc' },
    select: { created_at: true }
  });
  const newestUser = await prisma.user.findFirst({
    orderBy: { created_at: 'desc' },
    select: { created_at: true }
  });

  if (oldestUser && newestUser) {
    console.log(`\n📅 Rango de fechas:`);
    console.log(`   - Usuario más antiguo: ${oldestUser.created_at.toISOString().split('T')[0]}`);
    console.log(`   - Usuario más reciente: ${newestUser.created_at.toISOString().split('T')[0]}`);
  }

  console.log('\n✅ Verificación completada');
}

verify()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
