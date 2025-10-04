import { PrismaClient, AssignmentGroup, AssignmentMethod } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConsentPayload {
  documentVersion: string;
  accepted: boolean;
}

export interface RandomizePayload {
  method?: AssignmentMethod | string;
  seed?: string;
}

const DEFAULT_METHOD = 'azar';
const AUTO_ASSIGN_SEED = 'auto_round_robin';

function createRandom(seed?: string) {
  if (!seed) {
    let state = Math.floor(Math.random() * 1_000_000);
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed?: string) {
  const arr = [...items];
  const random = createRandom(seed);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

export const autoAssignParticipant = async (userId: number) => {
  const existingAssignment = await prisma.assignment.findFirst({
    where: { user_id: userId },
  });
  if (existingAssignment) {
    return existingAssignment;
  }

  const [geCount, gcCount] = await Promise.all([
    prisma.assignment.count({ where: { group: AssignmentGroup.GE } }),
    prisma.assignment.count({ where: { group: AssignmentGroup.GC } }),
  ]);

  const nextGroup = geCount <= gcCount ? AssignmentGroup.GE : AssignmentGroup.GC;

  const assignment = await prisma.$transaction(async (tx) => {
    const createdAssignment = await tx.assignment.create({
      data: {
        user_id: userId,
        group: nextGroup,
        method: AssignmentMethod.azar,
        seed: AUTO_ASSIGN_SEED,
      },
    });

    await tx.featureFlag.upsert({
      where: { user_id: userId },
      update: {
        chatbot: nextGroup === AssignmentGroup.GE,
        adaptativo: nextGroup === AssignmentGroup.GE,
      },
      create: {
        user_id: userId,
        chatbot: nextGroup === AssignmentGroup.GE,
        adaptativo: nextGroup === AssignmentGroup.GE,
      },
    });

    return createdAssignment;
  });

  return assignment;
};

export const recordConsent = async (userId: number, payload: ConsentPayload) => {
  const { documentVersion, accepted } = payload;
  if (!documentVersion) {
    throw new Error('documentVersion is required');
  }

  const consent = await prisma.consent.create({
    data: {
      user_id: userId,
      document_version: documentVersion,
      accepted,
    },
  });

  return consent;
};

export const randomizeParticipants = async (payload: RandomizePayload = {}) => {
  const method = (payload.method as AssignmentMethod) || DEFAULT_METHOD;
  const seed = payload.seed;

  const unassignedUsers = await prisma.user.findMany({
    where: {
      assignments: {
        none: {},
      },
    },
    select: {
      user_id: true,
      participant_code: true,
    },
  });

  if (unassignedUsers.length === 0) {
    return { assigned: 0, groups: { GE: 0, GC: 0 } };
  }

  const shuffled = shuffleWithSeed(unassignedUsers, seed);
  const summary = { GE: 0, GC: 0 } as Record<AssignmentGroup, number>;

  await prisma.$transaction(async tx => {
    for (let index = 0; index < shuffled.length; index += 1) {
      const user = shuffled[index]!;
      const group: AssignmentGroup = index % 2 === 0 ? AssignmentGroup.GE : AssignmentGroup.GC;
      summary[group] += 1;

      await tx.assignment.create({
        data: {
          user_id: user.user_id,
          group,
          method,
          seed: seed ?? null,
        },
      });

      await tx.featureFlag.upsert({
        where: { user_id: user.user_id },
        update: {
          chatbot: group === AssignmentGroup.GE,
          adaptativo: group === AssignmentGroup.GE,
        },
        create: {
          user_id: user.user_id,
          chatbot: group === AssignmentGroup.GE,
          adaptativo: group === AssignmentGroup.GE,
        },
      });
    }
  });

  return { assigned: shuffled.length, groups: summary, method, seed };
};

export const getFeatureFlagsForUser = async (userId: number) => {
  let flags = await prisma.featureFlag.findUnique({
    where: { user_id: userId },
    include: {
      user: {
        select: {
          participant_code: true,
          assignments: {
            orderBy: { assigned_at: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!flags) {
    flags = await prisma.featureFlag.create({
      data: {
        user_id: userId,
      },
      include: {
        user: {
          select: {
            participant_code: true,
            assignments: {
              orderBy: { assigned_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  const assignment = flags.user.assignments[0];

  return {
    participant_code: flags.user.participant_code,
    chatbot: flags.chatbot,
    adaptativo: flags.adaptativo,
    assigned_group: assignment?.group ?? null,
    assignment_method: assignment?.method ?? null,
    assigned_at: assignment?.assigned_at ?? null,
  };
};

export const getRandomizationSummary = async () => {
  const [totalParticipants, groupedAssignments, unassignedCount, latestAssignment] = await Promise.all([
    prisma.user.count(),
    prisma.assignment.groupBy({
      by: ['group'],
      _count: {
        group: true,
      },
    }),
    prisma.user.count({
      where: {
        assignments: {
          none: {},
        },
      },
    }),
    prisma.assignment.findFirst({
      orderBy: { assigned_at: 'desc' },
      select: {
        assigned_at: true,
        method: true,
        seed: true,
      },
    }),
  ]);

  const groupSummary: Record<AssignmentGroup, number> = {
    GE: 0,
    GC: 0,
  };

  groupedAssignments.forEach((entry) => {
    const castedGroup = entry.group as AssignmentGroup;
    groupSummary[castedGroup] = entry._count.group;
  });

  return {
    totalParticipants,
    assigned: groupSummary,
    unassigned: unassignedCount,
    lastRun: latestAssignment
      ? {
          assigned_at: latestAssignment.assigned_at,
          method: latestAssignment.method,
          seed: latestAssignment.seed,
        }
      : null,
  };
};
