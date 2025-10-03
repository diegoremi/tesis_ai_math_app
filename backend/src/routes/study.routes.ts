import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import {
  submitConsentController,
  randomizeParticipantsController,
  getFeatureFlagsController,
  getRandomizationSummaryController,
} from '../controllers/study.controller.js';

const router = Router();

router.use(authenticateToken);

router.post('/consent', submitConsentController);
router.post('/randomize', authorizeRole(['admin']), randomizeParticipantsController);
router.get('/feature-flags', getFeatureFlagsController);
router.get('/randomize/summary', authorizeRole(['admin']), getRandomizationSummaryController);

export default router;
