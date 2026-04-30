import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface ApiError {
  message: string;
  status: number;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401/403 and generic errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ error?: { message: string; status: number } }>) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;

      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Auth
export const login = (credentials: { email: string; password: string }) =>
  apiClient.post<{ token: string }>('/auth/login', credentials);

export const logout = () => {
  localStorage.removeItem('token');
};

export const registerUser = (userData: Record<string, unknown>) =>
  apiClient.post('/users', userData);

// Users
export const getProfile = () => apiClient.get('/users/profile');
export const updateProfile = (userData: Record<string, unknown>) =>
  apiClient.put('/users/profile', userData);
export const updatePassword = (passwordData: Record<string, unknown>) =>
  apiClient.put('/users/password', passwordData);

// Activities / Practice
export const getExercise = () => apiClient.get('/activities/exercise');
export const submitAnswer = (answerData: { exerciseId: number; userAnswer: string }) =>
  apiClient.post('/activities/exercise/submit', answerData);
export const getActivities = () => apiClient.get('/activities');

// Assessments
export const getAssessments = () => apiClient.get('/evaluations');
export const createAssessment = (assessmentPayload: Record<string, unknown>) =>
  apiClient.post('/evaluations', assessmentPayload);
export const getAssessmentItems = (params: { type?: string; version?: string }) =>
  apiClient.get('/evaluations/items', { params });

// AI
export const chat = (message: string) =>
  apiClient.post('/ai/chat', { message });
export const getHint = (exerciseId: number, hintLevel = 0) =>
  apiClient.post('/ai/hint', { exerciseId, hintLevel });

// Survey
export const submitSurvey = (surveyData: Record<string, unknown>) =>
  apiClient.post('/survey/submit', surveyData);
export const getSurveyItems = (params: { instrument?: string; version?: string }) =>
  apiClient.get('/survey/items', { params });

// Study
export const submitConsent = (consentPayload: { documentVersion: string; accepted: boolean }) =>
  apiClient.post('/study/consent', consentPayload);
export const randomizeParticipants = (randomizePayload: Record<string, unknown>) =>
  apiClient.post('/study/randomize', randomizePayload);
export const fetchFeatureFlags = () => apiClient.get('/study/feature-flags');
export const getRandomizationSummary = () => apiClient.get('/study/randomize/summary');
export const generateTheoryModule = (moduleIndex: number) =>
  apiClient.post('/study/theory/generate', { moduleIndex });
export const recordTheoryProgress = (progressPayload: Record<string, unknown>) =>
  apiClient.post('/study/theory/progress', progressPayload);
export const submitTheoryCheckpoint = (checkpointPayload: Record<string, unknown>) =>
  apiClient.post('/study/theory/checkpoint', checkpointPayload);
export const getStudyStatus = () => apiClient.get('/study/status');

// Events
export const logEvent = (eventPayload: Record<string, unknown>) =>
  apiClient.post('/events', eventPayload);
export const fetchEvents = (params: Record<string, unknown> = {}) =>
  apiClient.get('/events', { params });

// Admin
export const getUsers = () => apiClient.get('/admin/users');
export const getAdminActivities = () => apiClient.get('/admin/activities');
export const getAdminAssessments = () => apiClient.get('/admin/assessments');
export const exportData = (dataType: string) =>
  apiClient.get(`/admin/export?type=${dataType}`, { responseType: 'blob' });
export const fetchAncovaDataset = (params: Record<string, unknown> = {}) =>
  apiClient.get('/admin/exports/ancova-dataset', { params });
export const updateUserFeatureFlags = (userId: number, flags: Record<string, boolean>) =>
  apiClient.patch(`/admin/users/${userId}/feature-flags`, flags);
export const fetchAdminReport = () => apiClient.get('/admin/export/report');
