import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireConsent } from '../middleware/study.middleware.js';
import { submitSurveyController, getSurveyItemsController } from '../controllers/survey.controller.js';

const router = Router();

router.use(authenticateToken);

// Getting survey items doesn't require consent
router.get('/items', getSurveyItemsController);

// Submitting surveys requires consent
router.use(requireConsent);
router.post('/submit', submitSurveyController);

export default router;
