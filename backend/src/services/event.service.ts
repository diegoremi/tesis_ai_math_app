import { EventType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

interface EventPayload {
  event_type: EventType | string;
  metadata?: Record<string, unknown>;
  occurred_at?: string | Date;
}

export const logEvent = async (userId: number, payload: EventPayload) => {
  const { event_type, metadata, occurred_at } = payload;

  const eventData: Prisma.EventCreateInput = {
    user: { connect: { user_id: userId } },
    event_type: event_type as EventType,
  };

  if (metadata !== undefined) {
    eventData.metadata = metadata as Prisma.InputJsonValue;
  }

  if (occurred_at) {
    eventData.occurred_at = new Date(occurred_at);
  }

  const event = await prisma.event.create({
    data: eventData,
  });

  return event;
};

export const listEvents = async (userId: number, limit = 200) => {
  const events = await prisma.event.findMany({
    where: { user_id: userId },
    orderBy: { occurred_at: 'desc' },
    take: limit,
  });
  return events;
};
