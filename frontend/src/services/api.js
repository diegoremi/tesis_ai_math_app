import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
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
  (error) => {
    return Promise.reject(error);
  }
);

export const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

export const getProfile = () => {
  return apiClient.get('/users/profile');
};

export const updateProfile = (userData) => {
  return apiClient.put('/users/profile', userData);
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getActivities = () => {
  return apiClient.get('/activities');
};

export const getAssessments = () => {
  return apiClient.get('/evaluations');
};

export const createAssessment = (assessmentPayload) => {
  return apiClient.post('/evaluations', assessmentPayload);
};

export const getAssessmentItems = (params) => {
  return apiClient.get('/evaluations/items', { params });
};

export const getExercise = () => {
  return apiClient.get('/activities/exercise');
};

export const submitAnswer = (answerData) => {
  return apiClient.post('/activities/exercise/submit', answerData);
};

export const chat = (message) => {
  return apiClient.post('/ai/chat', { message });
};

export const submitSurvey = (surveyData) => {
  return apiClient.post('/survey/submit', surveyData);
};

export const getSurveyItems = (params) => {
  return apiClient.get('/survey/items', { params });
};

export const submitConsent = (consentPayload) => {
  return apiClient.post('/study/consent', consentPayload);
};

export const randomizeParticipants = (randomizePayload) => {
  return apiClient.post('/study/randomize', randomizePayload);
};

export const fetchFeatureFlags = () => {
  return apiClient.get('/study/feature-flags');
};

export const logEvent = (eventPayload) => {
  return apiClient.post('/events', eventPayload);
};

export const fetchEvents = (params = {}) => {
  return apiClient.get('/events', { params });
};

export const getUsers = () => {
  return apiClient.get('/admin/users');
};

export const getAdminActivities = () => {
  return apiClient.get('/admin/activities');
};

export const getAdminAssessments = () => {
  return apiClient.get('/admin/assessments');
};

export const exportData = (dataType) => {
  return apiClient.get(`/admin/export?type=${dataType}`, { responseType: 'blob' });
};

export const updatePassword = (passwordData) => {
  return apiClient.put('/users/password', passwordData);
};

export const registerUser = (userData) => {
  return apiClient.post('/users', userData);
};

export const getHint = (exerciseId) => {
  return apiClient.post('/ai/hint', { exerciseId });
};
