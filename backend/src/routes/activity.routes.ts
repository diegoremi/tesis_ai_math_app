
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  createActivityController,
  getActivitiesController,
  getActivityByIdController,
  updateActivityController,
  deleteActivityController,
} from '../controllers/activity.controller.js';

const router = Router();

// All activity routes require authentication
router.use(authenticateToken);

router.post('/', createActivityController);
router.get('/', getActivitiesController);
router.get('/:id', getActivityByIdController);
router.put('/:id', updateActivityController);
router.delete('/:id', deleteActivityController);



export default router;
