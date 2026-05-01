import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAnalytics = async () => {
  const [
    totalParticipants,
    consentCount,
    pretestCount,
    posttestCount,
    groupCounts,
    dailySignups,
    completionRates,
    averageScores,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.consent.count({ where: { accepted: true } }),
    prisma.assessment.count({ where: { assessment_type: 'pretest' } }),
    prisma.assessment.count({ where: { assessment_type: 'posttest' } }),
    prisma.assignment.groupBy({
      by: ['group'],
      _count: { group: true },
    }),
    prisma.user.groupBy({
      by: ['created_at'],
      _count: { user_id: true },
      orderBy: { created_at: 'desc' },
      take: 30,
    }),
    Promise.all([
      prisma.assessment.count({ where: { assessment_type: 'pretest' } }),
      prisma.assessment.count({ where: { assessment_type: 'posttest' } }),
    ]),
    Promise.all([
      prisma.assessment.aggregate({
        where: { assessment_type: 'pretest' },
        _avg: { total_score: true },
      }),
      prisma.assessment.aggregate({
        where: { assessment_type: 'posttest' },
        _avg: { total_score: true },
      }),
    ]),
  ]);

  const groupDistribution = groupCounts.reduce((acc, curr) => {
    acc[curr.group] = curr._count.group;
    return acc;
  }, {} as Record<string, number>);

  const pretestRate = totalParticipants > 0 
    ? Number(((pretestCount / totalParticipants) * 100).toFixed(1)) 
    : 0;
  
  const posttestRate = pretestCount > 0 
    ? Number(((posttestCount / pretestCount) * 100).toFixed(1)) 
    : 0;

  return {
    overview: {
      totalParticipants,
      consentCount,
      pretestCount,
      posttestCount,
      pretestRate,
      posttestRate,
    },
    groups: groupDistribution,
    dailySignups: dailySignups.map((day) => ({
      date: day.created_at.toISOString().split('T')[0],
      count: day._count.user_id,
    })),
    scores: {
      pretestAverage: averageScores[0]._avg.total_score ?? 0,
      posttestAverage: averageScores[1]._avg.total_score ?? 0,
    },
  };
};

export const getParticipantProgress = async () => {
  const participants = await prisma.user.findMany({
    include: {
      assignments: {
        orderBy: { assigned_at: 'desc' },
        take: 1,
      },
      assessments: true,
      consents: {
        where: { accepted: true },
        take: 1,
      },
      activities: true,
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  return participants.map((p) => {
    const hasConsent = p.consents.length > 0;
    const hasPretest = p.assessments.some((a: { assessment_type: string }) => a.assessment_type === 'pretest');
    const hasPosttest = p.assessments.some((a: { assessment_type: string }) => a.assessment_type === 'posttest');
    const exerciseCount = p.activities.filter((a: { activity_type: string }) => a.activity_type === 'exercise').length;

    return {
      id: p.user_id,
      code: p.participant_code,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      email: p.email,
      group: p.assignments[0]?.group ?? 'SIN_GRUPO',
      registeredAt: p.created_at,
      hasConsent,
      hasPretest,
      hasPosttest,
      exerciseCount,
      progress: {
        registered: true,
        consented: hasConsent,
        pretested: hasPretest,
        completed: hasPosttest,
      },
    };
  });
};
