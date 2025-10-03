import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getStoredPracticeItem, mapDomainToTopic } from '../services/practice.service.js';
import { getPracticeItemById } from '../services/planner.service.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';
const prisma = new PrismaClient();

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
    throw Object.assign(new Error('Chatbot disabled for cohort'), { status: 403 });
  }
  return flags;
};

export const chatController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    await ensureChatbotAccess(userId, req.user?.role);

    const { message } = req.body;
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/chat`, { message });

    const promptHash = hashPrompt(message ?? '');
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
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    if (status === 403) {
      return res.status(403).json({ message: 'TutorAgent is disabled for your group.' });
    }
    console.error('Error communicating with AI module:', error);
    res.status(500).json({ message: 'Error communicating with AI module' });
  }
};

export const hintController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    await ensureChatbotAccess(userId, req.user?.role);

    const { exerciseId } = req.body;
    if (typeof exerciseId !== 'number') {
      return res.status(400).json({ message: 'exerciseId (number) is required' });
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
          competency: (legacy.competency as any) ?? 'operaciones',
        };
      }
    }

    if (!item) {
      return res.status(404).json({ message: 'Practice item not found for hint generation' });
    }

    const payload = {
      stem: item.stem,
      options: item.options,
      domain: item.domain,
      competency: item.competency,
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
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    if (status === 403) {
      return res.status(403).json({ message: 'TutorAgent is disabled for your group.' });
    }
    console.error('Error requesting AI hint:', error);
    res.status(500).json({ message: 'Error generating hint with AI service' });
  }
};
