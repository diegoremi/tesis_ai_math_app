import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { chatController, hintController } from '../controllers/ai.controller.js';

const router = Router();

router.use(authenticateToken);

router.post('/chat', chatController);
router.post('/hint', hintController);

export default router;
