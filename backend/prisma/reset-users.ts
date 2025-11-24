/**
 * reset-users.ts
 *
 * Limpia todos los datos de usuarios de la base de datos,
 * preservando los bancos de items (AssessmentItem, SurveyItem).
 *
 * Uso: npx tsx prisma/reset-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUsers() {
  console.log('🧹 Iniciando limpieza de base de datos...\n');

  // Orden de eliminación respetando foreign keys
  // (aunque onDelete: Cascade debería manejar la mayoría)

  const tables = [
    // Tablas que dependen de otras tablas de usuario
    { name: 'TheoryProgress', model: prisma.theoryProgress },
    { name: 'TheoryModule', model: prisma.theoryModule },
    { name: 'PracticeAttempt', model: prisma.practiceAttempt },
    { name: 'PracticeGenerated', model: prisma.practiceGenerated },
    { name: 'PracticeSummary', model: prisma.practiceSummary },
    { name: 'Event', model: prisma.event },
    { name: 'SurveyResponse', model: prisma.surveyResponse },
    { name: 'SurveySubmission', model: prisma.surveySubmission },
    { name: 'Survey', model: prisma.survey },
    { name: 'AssessmentResponse', model: prisma.assessmentResponse },
    { name: 'Assessment', model: prisma.assessment },
    { name: 'AIFeedback', model: prisma.aIFeedback },
    { name: 'Activity', model: prisma.activity },
    { name: 'Infrastructure', model: prisma.infrastructure },
    { name: 'FeatureFlag', model: prisma.featureFlag },
    { name: 'Assignment', model: prisma.assignment },
    { name: 'Consent', model: prisma.consent },
    { name: 'Session', model: prisma.session },
    // Tabla principal de usuarios (última)
    { name: 'User', model: prisma.user },
  ];

  let totalDeleted = 0;

  for (const { name, model } of tables) {
    try {
      const result = await (model as any).deleteMany({});
      console.log(`  ✓ ${name}: ${result.count} registros eliminados`);
      totalDeleted += result.count;
    } catch (error) {
      console.error(`  ✗ Error eliminando ${name}:`, error);
    }
  }

  console.log(`\n✅ Limpieza completada. Total: ${totalDeleted} registros eliminados.`);

  // Verificar que los bancos de items están intactos
  const assessmentItemCount = await prisma.assessmentItem.count();
  const surveyItemCount = await prisma.surveyItem.count();

  console.log('\n📊 Bancos de items preservados:');
  console.log(`  • AssessmentItem: ${assessmentItemCount} items`);
  console.log(`  • SurveyItem: ${surveyItemCount} items`);

  if (assessmentItemCount === 0 || surveyItemCount === 0) {
    console.log('\n⚠️  Los bancos de items están vacíos. Ejecuta: npx prisma db seed');
  } else {
    console.log('\n✅ Base de datos lista para nuevos usuarios.');
  }
}

resetUsers()
  .catch((e) => {
    console.error('Error durante la limpieza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
