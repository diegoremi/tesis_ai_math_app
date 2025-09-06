
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  createAssessmentController,
  getAssessmentsController,
  getAssessmentByIdController,
  updateAssessmentController,
  deleteAssessmentController,
} from '../controllers/evaluation.controller.js';

const router = Router();

// All evaluation routes require authentication
router.use(authenticateToken);

router.post('/', createAssessmentController);
router.get('/', getAssessmentsController);
router.get('/:id', getAssessmentByIdController);
router.put('/:id', updateAssessmentController);
router.delete('/:id', deleteAssessmentController);



export default router;
