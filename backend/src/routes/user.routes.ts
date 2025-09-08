
import { Router } from 'express';
import { createUserController, getUserProfile, updateUserController, updatePasswordController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', createUserController);
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserController);
router.put('/password', authenticateToken, updatePasswordController);

export default router;
