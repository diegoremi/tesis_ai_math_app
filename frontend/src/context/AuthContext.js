
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, fetchFeatureFlags, getAssessments } from '../services/api';

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

  const computeAssessmentStatus = (assessments = []) => {
    const pretestCompleted = assessments.some((assessment) => assessment.assessment_type === 'pretest');
    const posttestCompleted = assessments.some((assessment) => assessment.assessment_type === 'posttest');
    return { pretestCompleted, posttestCompleted };
  };

  const setDefaultAssessmentStatus = () => {
    setAssessmentStatus({ pretestCompleted: false, posttestCompleted: false, loaded: true });
  };

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

  useEffect(() => {
    const token = localStorage.getItem('token');

    const initialise = async () => {
      if (token) {
        const decodedUser = decodeJwt(token);
        if (decodedUser) {
          setIsAuthenticated(true);
          setUser(decodedUser);
          await Promise.all([fetchFeatureFlagSnapshot(), fetchAssessmentStatus()]);
        } else {
          localStorage.removeItem('token');
          setDefaultAssessmentStatus();
        }
      } else {
        setDefaultAssessmentStatus();
      }
      setLoading(false);
    };

    initialise();
  }, [fetchFeatureFlagSnapshot, fetchAssessmentStatus]);

  const login = async (credentials) => {
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
        return status.pretestCompleted ? 'dashboard' : 'pretest';
      } else {
        console.error('Login successful but token invalid.');
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
        setFeatureFlags(null);
        setDefaultAssessmentStatus();
        return 'error';
      }
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setFeatureFlags(null);
      setDefaultAssessmentStatus();
      return 'error';
    }
  };

  const logout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setUser(null);
    setFeatureFlags(null);
    setDefaultAssessmentStatus();
  };

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
        loading,
        login,
        logout,
        refreshFeatureFlags: fetchFeatureFlagSnapshot,
        refreshAssessmentStatus: fetchAssessmentStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
