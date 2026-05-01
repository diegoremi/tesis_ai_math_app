
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireConsent } from '../middleware/study.middleware.js';
import {
  createAssessmentController,
  getAssessmentsController,
  getAssessmentByIdController,
  updateAssessmentController,
  deleteAssessmentController,
  getAssessmentItemsController,
} from '../controllers/evaluation.controller.js';

const router = Router();

// All evaluation routes require authentication
router.use(authenticateToken);

// Getting items doesn't require consent (needed for pretest)
router.get('/items', getAssessmentItemsController);

// Creating, updating, deleting assessments requires consent
router.use(requireConsent);
router.post('/', createAssessmentController);
router.get('/', getAssessmentsController);
router.get('/:id', getAssessmentByIdController);
router.put('/:id', updateAssessmentController);
router.delete('/:id', deleteAssessmentController);



export default router;
