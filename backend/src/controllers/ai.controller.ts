import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import axios from 'axios';
import crypto from 'crypto';
import { getStoredPracticeItem, mapDomainToTopic } from '../services/practice.service.js';
import { getPracticeItemById } from '../services/planner.service.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';

const hashPrompt = (payload: unknown) => {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
  return crypto.createHash('sha256').update(serialized).digest('hex');
};

const ensureChatbotAccess = async (userId: number, role?: string | null) => {
  if (role === 'admin') {
    return null;
  }
  const flags = await prisma.featureFlag.findUnique({ where: { user_id: userId } });
  if (!flags || !flags.chatbot) {
    throw new AppError('Chatbot disabled for cohort', 403);
  }
  return flags;
};

export const chatController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  await ensureChatbotAccess(userId, req.user?.role);

  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('message (non-empty string) is required', 400);
  }
  if (message.length > 2000) {
    throw new AppError('message exceeds maximum length of 2000 characters', 400);
  }

  const aiResponse = await axios.post(`${AI_SERVICE_URL}/chat`, { message });

  const promptHash = hashPrompt(message);
  const tokenCount = Number(aiResponse.data?.usage?.totalTokens ?? aiResponse.data?.usage?.total_tokens ?? NaN);

  await prisma.aIFeedback.create({
    data: {
      user_id: userId,
      message_type: 'motivation',
      ai_message: aiResponse.data?.response ?? '',
      prompt_hash: promptHash,
      token_count: Number.isFinite(tokenCount) ? tokenCount : null,
    },
  });

  res.status(200).json(aiResponse.data);
};

export const hintController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User ID not found in token', 400);
  }

  await ensureChatbotAccess(userId, req.user?.role);

  const { exerciseId, hintLevel = 0 } = req.body;
  if (typeof exerciseId !== 'number') {
    throw new AppError('exerciseId (number) is required', 400);
  }
  if (typeof hintLevel !== 'number' || hintLevel < 0 || hintLevel > 3) {
    throw new AppError('hintLevel must be a number between 0 and 3', 400);
  }

  let item = await getStoredPracticeItem(exerciseId);

  if (!item) {
    const legacy = await getPracticeItemById(exerciseId);
    if (legacy) {
      item = {
        stem: legacy.stem,
        options: legacy.options.map((option) => ({
          key: option.key,
          label: option.label,
        })),
        domain: mapDomainToTopic(legacy.domain ?? null),
        competency: (legacy.competency as 'operaciones' | 'razones_y_porcentajes' | 'ecuaciones_lineales' | 'simplificacion') ?? 'operaciones',
      };
    }
  }

  if (!item) {
    throw new AppError('Practice item not found for hint generation', 404);
  }

  const payload = {
    stem: item.stem,
    options: item.options,
    domain: item.domain,
    competency: item.competency,
    hint_level: hintLevel,
  };

  const aiResponse = await axios.post(`${AI_SERVICE_URL}/hint`, payload);

  const promptHash = hashPrompt(payload);
  const tokenCount = Number(aiResponse.data?.usage?.totalTokens ?? aiResponse.data?.usage?.total_tokens ?? NaN);

  await prisma.aIFeedback.create({
    data: {
      user_id: userId,
      activity_id: null,
      message_type: 'hint',
      ai_message: aiResponse.data?.hint ?? '',
      prompt_hash: promptHash,
      token_count: Number.isFinite(tokenCount) ? tokenCount : null,
    },
  });

  res.status(200).json(aiResponse.data);
};
