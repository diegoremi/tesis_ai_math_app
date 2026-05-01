
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireConsent, requirePretestCompletion } from '../middleware/study.middleware.js';
import {
  createActivityController,
  getActivitiesController,
  getActivityByIdController,
  updateActivityController,
  deleteActivityController,
  getExerciseController,
  submitAnswerController,
} from '../controllers/activity.controller.js';

const router = Router();

// All activity routes require authentication
router.use(authenticateToken);
router.use(requireConsent);
router.use(requirePretestCompletion);

router.get('/exercise', getExerciseController);
router.post('/exercise/submit', submitAnswerController);
router.post('/', createActivityController);
router.get('/', getActivitiesController);
router.get('/:id', getActivityByIdController);
router.put('/:id', updateActivityController);
router.delete('/:id', deleteActivityController);



export default router;
