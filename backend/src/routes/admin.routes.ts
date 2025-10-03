import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import {
  getUsersController,
  getActivitiesController as getAllActivitiesController,
  getAssessmentsController as getAllAssessmentsController,
  exportDataController,
  exportAncovaDatasetController,
} from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'facilitator']));

router.get('/users', getUsersController);
router.get('/activities', getAllActivitiesController);
router.get('/assessments', getAllAssessmentsController);
router.get('/export', exportDataController);
router.get('/exports/ancova-dataset', exportAncovaDatasetController);

export default router;
