import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import activityRoutes from './routes/activity.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import aiRoutes from './routes/ai.routes.js';
import surveyRoutes from './routes/survey.routes.js';
import adminRoutes from './routes/admin.routes.js';
import studyRoutes from './routes/study.routes.js';
import eventRoutes from './routes/event.routes.js';
import { requestLogger } from './middleware/errorLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app: Express = express();

// Trust proxy headers from Render/Vercel (required for express-rate-limit behind a reverse proxy)
app.set('trust proxy', 1);

// CORS must be applied before any other middleware to ensure preflight responses include headers
app.use(cors({
  origin: (origin, callback) => {
    logger.info(`CORS check for origin: ${origin || 'none'}`);
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://tesis-ai-math-app.vercel.app',
      'https://tesis-ai-math-app-diegoremis-projects.vercel.app',
      'https://tesis-ai-math-app-git-main-diegoremis-projects.vercel.app',
      'http://localhost:3000'
    ];

    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many AI requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(requestLogger);

app.use('/api/users', userRoutes);
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/ai', aiRateLimit, aiRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/events', eventRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
