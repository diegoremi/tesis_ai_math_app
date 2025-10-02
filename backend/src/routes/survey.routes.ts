import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { submitSurveyController, getSurveyItemsController } from '../controllers/survey.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/items', getSurveyItemsController);
router.post('/submit', submitSurveyController);

export default router;
