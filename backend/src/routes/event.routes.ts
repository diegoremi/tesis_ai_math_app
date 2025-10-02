import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { createEventController, listEventsController } from '../controllers/event.controller.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createEventController);
router.get('/', listEventsController);

export default router;
