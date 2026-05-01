import "dotenv/config";
import { prisma } from '../src/lib/prisma.js';

beforeAll(async () => {
  // Ensure clean test state
});

afterEach(async () => {
  // Clean up test data after each test
  await prisma.aIFeedback.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
