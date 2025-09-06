import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
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