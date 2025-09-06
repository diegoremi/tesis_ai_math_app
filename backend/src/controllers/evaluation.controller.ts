
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createAssessment, getAssessmentsByUserId, getAssessmentById, updateAssessment, deleteAssessment } from '../services/evaluation.service.js';

export const createAssessmentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const newAssessment = await createAssessment(userId, req.body);
    res.status(201).json(newAssessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating assessment' });
  }
};

export const getAssessmentsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const assessments = await getAssessmentsByUserId(userId);
    res.status(200).json(assessments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assessments' });
  }
};

export const getAssessmentByIdController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    // Ensure the assessment belongs to the authenticated user
    if (assessment.user_id !== req.user?.userId) {
      return res.status(403).json({ message: 'Unauthorized access to assessment' });
    }
    res.status(200).json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assessment' });
  }
};

export const updateAssessmentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    // First, check if the assessment exists and belongs to the user
    const existingAssessment = await getAssessmentById(assessmentId);
    if (!existingAssessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    if (existingAssessment.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this assessment' });
    }

    const updatedAssessment = await updateAssessment(assessmentId, req.body);
    res.status(200).json(updatedAssessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating assessment' });
  }
};

export const deleteAssessmentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    // First, check if the assessment exists and belongs to the user
    const existingAssessment = await getAssessmentById(assessmentId);
    if (!existingAssessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    if (existingAssessment.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this assessment' });
    }

    await deleteAssessment(assessmentId);
    res.status(204).send(); // No content
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting assessment' });
  }
};
