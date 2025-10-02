import { PrismaClient, SurveyInstrument } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  await prisma.assessmentResponse.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.assessmentItem.deleteMany({});
  await prisma.surveyResponse.deleteMany({});
  await prisma.surveySubmission.deleteMany({});
  await prisma.surveyItem.deleteMany({});

  await prisma.assessmentItem.createMany({
    data: [
      {
        test_version: 'v1',
        domain: 'algebra',
        competency: 'linear_equations',
        stem: 'Solve for x: 3x + 7 = 22',
        options: [
          { key: 'a', label: '3' },
          { key: 'b', label: '4' },
          { key: 'c', label: '5' },
          { key: 'd', label: '6' },
        ],
        correct_key: 'c',
      },
      {
        test_version: 'v1',
        domain: 'arithmetic',
        competency: 'powers',
        stem: 'Evaluate: 2(5^2) - 10',
        options: [
          { key: 'a', label: '30' },
          { key: 'b', label: '40' },
          { key: 'c', label: '45' },
          { key: 'd', label: '50' },
        ],
        correct_key: 'b',
      },
      {
        test_version: 'v1',
        domain: 'algebra',
        competency: 'polynomials',
        stem: 'Simplify: x^2 * x^3',
        options: [
          { key: 'a', label: 'x^5' },
          { key: 'b', label: 'x^6' },
          { key: 'c', label: 'x^8' },
          { key: 'd', label: 'x^10' },
        ],
        correct_key: 'a',
      },
      {
        test_version: 'v1',
        domain: 'number_theory',
        competency: 'prime_numbers',
        stem: 'Which of the following is a prime number?',
        options: [
          { key: 'a', label: '21' },
          { key: 'b', label: '27' },
          { key: 'c', label: '2' },
          { key: 'd', label: '35' },
        ],
        correct_key: 'c',
      },
      {
        test_version: 'exit_v1',
        domain: 'calculus',
        competency: 'derivatives',
        stem: 'Derive f(x) = 4x^3 - 5x + 7',
        options: [
          { key: 'a', label: '12x^2 - 5' },
          { key: 'b', label: '4x^2 - 5' },
          { key: 'c', label: '12x^3 - 5' },
          { key: 'd', label: '12x^2 + 7' },
        ],
        correct_key: 'a',
      },
      {
        test_version: 'exit_v1',
        domain: 'calculus',
        competency: 'integrals',
        stem: 'Calculate the definite integral ∫(2x) dx from 0 to 4',
        options: [
          { key: 'a', label: '12' },
          { key: 'b', label: '16' },
          { key: 'c', label: '20' },
          { key: 'd', label: '24' },
        ],
        correct_key: 'c',
      },
      {
        test_version: 'exit_v1',
        domain: 'sequences',
        competency: 'explicit_sequences',
        stem: 'A sequence is defined as a_n = 3n + 2. Find a_5',
        options: [
          { key: 'a', label: '15' },
          { key: 'b', label: '17' },
          { key: 'c', label: '18' },
          { key: 'd', label: '20' },
        ],
        correct_key: 'd',
      },
      {
        test_version: 'exit_v1',
        domain: 'calculus',
        competency: 'limits',
        stem: 'Select the correct limit: lim (x→0) sin(x)/x',
        options: [
          { key: 'a', label: '0' },
          { key: 'b', label: '1' },
          { key: 'c', label: 'Undefined' },
          { key: 'd', label: 'π' },
        ],
        correct_key: 'b',
      },
      {
        test_version: 'practice_v1',
        domain: 'algebra',
        competency: 'linear_equations',
        stem: 'Solve for x: 5x - 3 = 12',
        options: [
          { key: 'a', label: '2' },
          { key: 'b', label: '3' },
          { key: 'c', label: '4' },
          { key: 'd', label: '5' },
        ],
        correct_key: 'c',
      },
      {
        test_version: 'practice_v1',
        domain: 'geometry',
        competency: 'area_triangles',
        stem: 'What is the area of a triangle with base 8 and height 5?',
        options: [
          { key: 'a', label: '20' },
          { key: 'b', label: '30' },
          { key: 'c', label: '32' },
          { key: 'd', label: '40' },
        ],
        correct_key: 'a',
      },
      {
        test_version: 'practice_v1',
        domain: 'functions',
        competency: 'evaluating_functions',
        stem: 'If f(x) = 2x^2 - x, what is f(3)?',
        options: [
          { key: 'a', label: '12' },
          { key: 'b', label: '15' },
          { key: 'c', label: '18' },
          { key: 'd', label: '21' },
        ],
        correct_key: 'c',
      },
      {
        test_version: 'practice_v1',
        domain: 'statistics',
        competency: 'mean_calculation',
        stem: 'What is the mean of the numbers 6, 8, 10, 12?',
        options: [
          { key: 'a', label: '8' },
          { key: 'b', label: '9' },
          { key: 'c', label: '9.5' },
          { key: 'd', label: '10' },
        ],
        correct_key: 'b',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.surveyItem.createMany({
    data: [
      {
        instrument: SurveyInstrument.satisfaccion,
        subscale: 'utilidad',
        version: 'v1',
        prompt: 'How useful do you find the app?',
        sort_order: 1,
      },
      {
        instrument: SurveyInstrument.satisfaccion,
        subscale: 'utilidad',
        version: 'v1',
        prompt: 'The explanations helped me overcome obstacles.',
        sort_order: 2,
      },
      {
        instrument: SurveyInstrument.satisfaccion,
        subscale: 'facilidad',
        version: 'v1',
        prompt: 'How easy was it to navigate the daily lessons?',
        sort_order: 3,
      },
      {
        instrument: SurveyInstrument.satisfaccion,
        subscale: 'autonomia',
        version: 'v1',
        prompt: 'I felt in control of my learning plan.',
        sort_order: 4,
      },
      {
        instrument: SurveyInstrument.satisfaccion,
        subscale: 'motivacion',
        version: 'v1',
        prompt: 'I would recommend this experience to a friend.',
        sort_order: 5,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data inserted');
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
