import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import { requireConsent, requirePretestCompletion } from '../middleware/study.middleware.js';
import {
  submitConsentController,
  randomizeParticipantsController,
  getFeatureFlagsController,
  getRandomizationSummaryController,
  generateTheoryModuleController,
  recordTheoryProgressController,
  submitTheoryCheckpointController,
  getStudyStatusController,
} from '../controllers/study.controller.js';

const router = Router();

router.use(authenticateToken);

// Consent submission doesn't require consent (obviously)
router.post('/consent', submitConsentController);

// Feature flags and study status are needed for UI routing
router.get('/feature-flags', getFeatureFlagsController);
router.get('/status', getStudyStatusController);

// Admin only routes
router.post('/randomize', authorizeRole(['admin']), randomizeParticipantsController);
router.get('/randomize/summary', authorizeRole(['admin']), getRandomizationSummaryController);

// Intervention routes require consent + pretest completion
router.use(requireConsent);
router.use(requirePretestCompletion);
router.post('/theory/generate', generateTheoryModuleController);
router.post('/theory/progress', recordTheoryProgressController);
router.post('/theory/checkpoint', submitTheoryCheckpointController);

export default router;
