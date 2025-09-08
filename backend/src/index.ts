import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import activityRoutes from './routes/activity.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import aiRoutes from './routes/ai.routes.js';
import surveyRoutes from './routes/survey.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});