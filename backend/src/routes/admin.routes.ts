import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import {
  getUsersController,
  getActivitiesController as getAllActivitiesController,
  getAssessmentsController as getAllAssessmentsController,
  exportDataController,
  exportAncovaDatasetController,
  updateFeatureFlagsAdminController,
  exportFullReportController,
} from '../controllers/admin.controller.js';
import {
  getAnalyticsController,
  getParticipantProgressController,
} from '../controllers/analytics.controller.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

router.get('/users', getUsersController);
router.get('/activities', getAllActivitiesController);
router.get('/assessments', getAllAssessmentsController);
router.get('/analytics', getAnalyticsController);
router.get('/analytics/participants', getParticipantProgressController);
router.get('/export', exportDataController);
router.get('/exports/ancova-dataset', exportAncovaDatasetController);
router.get('/export/report', exportFullReportController);
router.patch('/users/:userId/feature-flags', updateFeatureFlagsAdminController);

export default router;
