
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  fetchFeatureFlags,
  getAssessments,
  getStudyStatus,
} from '../services/api';

// Helper function to decode JWT (basic, for demonstration)
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // New state for user data
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState({
    pretestCompleted: false,
    posttestCompleted: false,
    loaded: false,
  });
  const [studyStatus, setStudyStatus] = useState({
    modulesCompleted: 0,
    checkpointsPassed: 0,
    minutesInTheory: 0,
    requiredModules: 0,
    requiredCheckpoints: 0,
    posttestUnlocked: false,
    loaded: false,
  });

  const computeAssessmentStatus = (assessments = []) => {
    const pretestCompleted = assessments.some((assessment) => assessment.assessment_type === 'pretest');
    const posttestCompleted = assessments.some((assessment) => assessment.assessment_type === 'posttest');
    return { pretestCompleted, posttestCompleted };
  };

  const setDefaultAssessmentStatus = useCallback(() => {
    setAssessmentStatus({ pretestCompleted: false, posttestCompleted: false, loaded: true });
  }, []);

  const setDefaultStudyStatus = useCallback(() => {
    setStudyStatus({
      modulesCompleted: 0,
      checkpointsPassed: 0,
      minutesInTheory: 0,
      requiredModules: 0,
      requiredCheckpoints: 0,
      posttestUnlocked: false,
      loaded: true,
    });
  }, []);

  const fetchFeatureFlagSnapshot = useCallback(async () => {
    try {
      const response = await fetchFeatureFlags();
      setFeatureFlags(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      setFeatureFlags(null);
      return null;
    }
  }, []);

  const fetchAssessmentStatus = useCallback(async () => {
    try {
      const response = await getAssessments();
      const status = computeAssessmentStatus(response.data ?? []);
      setAssessmentStatus({ ...status, loaded: true });
      return status;
    } catch (error) {
      console.error('Failed to load assessment status:', error);
      const status = { pretestCompleted: false, posttestCompleted: false };
      setAssessmentStatus({ ...status, loaded: true });
      return status;
    }
  }, []);

  const fetchStudyStatusSnapshot = useCallback(async () => {
    try {
      const response = await getStudyStatus();
      setStudyStatus({ ...response.data, loaded: true });
      return response.data;
    } catch (error) {
      console.error('Failed to load study status:', error);
      setDefaultStudyStatus();
      return null;
    }
  }, [setDefaultStudyStatus]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const initialise = async () => {
      if (token) {
        const decodedUser = decodeJwt(token);
        if (decodedUser) {
          setIsAuthenticated(true);
          setUser(decodedUser);
          await Promise.all([
            fetchFeatureFlagSnapshot(),
            fetchAssessmentStatus(),
            fetchStudyStatusSnapshot(),
          ]);
        } else {
          localStorage.removeItem('token');
          setDefaultAssessmentStatus();
          setDefaultStudyStatus();
        }
      } else {
        setDefaultAssessmentStatus();
        setDefaultStudyStatus();
      }
      setLoading(false);
    };

    initialise();
  }, [
    fetchFeatureFlagSnapshot,
    fetchAssessmentStatus,
    fetchStudyStatusSnapshot,
    setDefaultAssessmentStatus,
    setDefaultStudyStatus,
  ]);

  const login = useCallback(
    async (credentials) => {
      try {
        const response = await apiLogin(credentials);
        const token = response.data.token;
        localStorage.setItem('token', token);
        const decodedUser = decodeJwt(token);
        if (decodedUser) {
          setIsAuthenticated(true);
          setUser(decodedUser);
          await fetchFeatureFlagSnapshot();
          const status = await fetchAssessmentStatus();
          await fetchStudyStatusSnapshot();
          return status.pretestCompleted ? 'dashboard' : 'pretest';
        }

        console.error('Login successful but token invalid.');
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
        setFeatureFlags(null);
        setDefaultAssessmentStatus();
        setDefaultStudyStatus();
        return 'error';
      } catch (error) {
        console.error('Login failed:', error);
        setIsAuthenticated(false);
        setUser(null);
        setFeatureFlags(null);
        setDefaultAssessmentStatus();
        setDefaultStudyStatus();
        return 'error';
      }
    },
    [
      fetchFeatureFlagSnapshot,
      fetchAssessmentStatus,
      fetchStudyStatusSnapshot,
      setDefaultAssessmentStatus,
      setDefaultStudyStatus,
    ],
  );

  const logout = useCallback(() => {
    apiLogout();
    setIsAuthenticated(false);
    setUser(null);
    setFeatureFlags(null);
    setDefaultAssessmentStatus();
    setDefaultStudyStatus();
  }, [setDefaultAssessmentStatus, setDefaultStudyStatus]);

  if (loading) {
    return <div>Cargando autenticación...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        featureFlags,
        assessmentStatus,
        studyStatus,
        loading,
        login,
        logout,
        refreshFeatureFlags: fetchFeatureFlagSnapshot,
        refreshAssessmentStatus: fetchAssessmentStatus,
        refreshStudyStatus: fetchStudyStatusSnapshot,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
