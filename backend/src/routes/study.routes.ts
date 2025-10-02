import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';
import {
  submitConsentController,
  randomizeParticipantsController,
  getFeatureFlagsController,
} from '../controllers/study.controller.js';

const router = Router();

router.use(authenticateToken);

router.post('/consent', submitConsentController);
router.post('/randomize', authorizeRole(['admin']), randomizeParticipantsController);
router.get('/feature-flags', getFeatureFlagsController);

export default router;
