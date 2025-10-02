import { PrismaClient, DifficultyLevel } from '@prisma/client';

const PRACTICE_VERSION = 'practice_v1';

const prisma = new PrismaClient();

type PracticeOption = { key: string; label: string };

type PracticeRecommendation = {
  itemId: number;
  stem: string;
  options: PracticeOption[];
  domain: string | null;
  competency: string | null;
  difficulty: DifficultyLevel;
};

const toOptions = (raw: unknown): PracticeOption[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (typeof entry === 'object' && entry !== null) {
        const key = 'key' in entry ? String((entry as any).key) : 'label' in entry ? String((entry as any).label) : '';
        const label = 'label' in entry ? String((entry as any).label) : key;
        if (!key || !label) {
          return null;
        }
        return { key, label };
      }
      if (typeof entry === 'string' || typeof entry === 'number') {
        const value = String(entry);
        return { key: value, label: value };
      }
      return null;
    })
    .filter((option): option is PracticeOption => option !== null);
};

const difficultyFromDomain = (domain?: string | null): DifficultyLevel => {
  switch (domain) {
    case 'calculus':
    case 'functions':
      return 'advanced';
    case 'algebra':
    case 'geometry':
      return 'intermediate';
    default:
      return 'basic';
  }
};

export const recommendPracticeItem = async (userId: number): Promise<PracticeRecommendation> => {
  const items = await prisma.assessmentItem.findMany({
    where: { test_version: PRACTICE_VERSION },
    orderBy: { item_id: 'asc' },
  });

  if (!items.length) {
    throw new Error('No practice items configured');
  }

  const activityStats = await prisma.activity.findMany({
    where: { user_id: userId, activity_type: 'exercise' },
    select: {
      domain: true,
      competency: true,
      attempts: true,
      correct_answers: true,
    },
  });

  const scoredItems = items.map((item) => {
    const stat = activityStats.find(
      (activity) => activity.domain === item.domain && activity.competency === item.competency
    );
    const attempts = stat?.attempts ?? 0;
    const accuracy = stat && stat.attempts ? stat.correct_answers / stat.attempts : 0;
    return {
      item,
      attempts,
      accuracy,
    };
  });

  scoredItems.sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }
    if (a.attempts !== b.attempts) {
      return a.attempts - b.attempts;
    }
    return a.item.item_id - b.item.item_id;
  });

  const selectedEntry = scoredItems[0];
  if (!selectedEntry) {
    throw new Error('No practice items could be recommended');
  }
  const selected = selectedEntry.item;
  const options = toOptions(selected.options as unknown);
  return {
    itemId: selected.item_id,
    stem: selected.stem,
    options,
    domain: selected.domain ?? null,
    competency: selected.competency ?? null,
    difficulty: difficultyFromDomain(selected.domain ?? null),
  };
};

export const gradePracticeAnswer = async (
  userId: number,
  itemId: number,
  userAnswer: string
): Promise<{ correct: boolean; accuracy: number; attempts: number }> => {
  const item = await prisma.assessmentItem.findUnique({
    where: { item_id: itemId },
  });

  if (!item) {
    throw new Error('Practice item not found');
  }

  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  const correctKey = item.correct_key.trim().toLowerCase();
  const isCorrect = normalizedUserAnswer === correctKey;

  const existingAggregation = await prisma.activity.findFirst({
    where: {
      user_id: userId,
      activity_type: 'exercise',
      domain: item.domain ?? null,
      competency: item.competency ?? null,
    },
  });

  const difficulty = difficultyFromDomain(item.domain ?? null);

  if (existingAggregation) {
    await prisma.activity.update({
      where: { activity_id: existingAggregation.activity_id },
      data: {
        attempts: existingAggregation.attempts + 1,
        correct_answers: existingAggregation.correct_answers + (isCorrect ? 1 : 0),
        status: 'completed',
        occurred_at: new Date(),
        domain: item.domain ?? null,
        competency: item.competency ?? null,
      },
    });
  } else {
    await prisma.activity.create({
      data: {
        user_id: userId,
        activity_type: 'exercise',
        difficulty_level: difficulty,
        attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        status: 'completed',
        domain: item.domain ?? null,
        competency: item.competency ?? null,
      },
    });
  }

  const latestAggregation = await prisma.activity.findFirst({
    where: {
      user_id: userId,
      activity_type: 'exercise',
      domain: item.domain ?? null,
      competency: item.competency ?? null,
    },
  });

  const attempts = latestAggregation?.attempts ?? (isCorrect ? 1 : 1);
  const accuracy = attempts > 0 ? (latestAggregation?.correct_answers ?? 0) / attempts : 0;

  return {
    correct: isCorrect,
    attempts,
    accuracy,
  };
};
