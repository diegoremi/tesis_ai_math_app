import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireConsent, requirePretestCompletion } from '../middleware/study.middleware.js';
import { chatController, hintController } from '../controllers/ai.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(requireConsent);
router.use(requirePretestCompletion);

router.post('/chat', chatController);
router.post('/hint', hintController);

export default router;
