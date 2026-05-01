import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

function sanitizeBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return body;
  }
  const sensitiveKeys = ['password', 'currentPassword', 'newPassword', 'recaptchaToken', 'authorization', 'token'];
  const sanitized = { ...body as Record<string, unknown> };
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info(`${req.method} ${req.path}`, {
    body: sanitizeBody(req.body),
    query: req.query,
    params: req.params,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'authorization': req.headers['authorization'] ? 'Bearer [REDACTED]' : 'none',
    },
  });
  next();
}
