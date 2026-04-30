import { createContext, useState, useEffect, useContext, useCallback, type ReactNode } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  fetchFeatureFlags,
  getAssessments,
  getStudyStatus,
} from '../services/api.ts';
import type { AuthContextType, FeatureFlags, AssessmentStatus, StudyStatus, User } from '../types/index.ts';

const decodeJwt = (token: string): User | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
    return {
      userId: Number(parsed.userId),
      role: String(parsed.role) as 'student' | 'admin',
    };
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>({
    pretestCompleted: false,
    posttestCompleted: false,
    loaded: false,
  });
  const [studyStatus, setStudyStatus] = useState<StudyStatus>({
    modulesCompleted: 0,
    checkpointsPassed: 0,
    minutesInTheory: 0,
    requiredModules: 0,
    requiredCheckpoints: 0,
    posttestUnlocked: false,
    loaded: false,
  });

  const computeAssessmentStatus = (assessments: Array<{ assessment_type: string }> = []): Omit<AssessmentStatus, 'loaded'> => {
    const pretestCompleted = assessments.some((a) => a.assessment_type === 'pretest');
    const posttestCompleted = assessments.some((a) => a.assessment_type === 'posttest');
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
      const data = response.data as FeatureFlags;
      setFeatureFlags(data);
      return data;
    } catch {
      setFeatureFlags(null);
      return null;
    }
  }, []);

  const fetchAssessmentStatus = useCallback(async () => {
    try {
      const response = await getAssessments();
      const assessments = (response.data as Array<{ assessment_type: string }>) ?? [];
      const status = computeAssessmentStatus(assessments);
      const fullStatus = { ...status, loaded: true };
      setAssessmentStatus(fullStatus);
      return fullStatus;
    } catch {
      const status = { pretestCompleted: false, posttestCompleted: false, loaded: true };
      setAssessmentStatus(status);
      return status;
    }
  }, []);

  const fetchStudyStatusSnapshot = useCallback(async () => {
    try {
      const response = await getStudyStatus();
      const data = response.data as StudyStatus;
      const fullStatus = { ...data, loaded: true };
      setStudyStatus(fullStatus);
      return fullStatus;
    } catch {
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
    async (credentials: { email: string; password: string }) => {
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

        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
        setFeatureFlags(null);
        setDefaultAssessmentStatus();
        setDefaultStudyStatus();
        return 'error' as const;
      } catch {
        setIsAuthenticated(false);
        setUser(null);
        setFeatureFlags(null);
        setDefaultAssessmentStatus();
        setDefaultStudyStatus();
        return 'error' as const;
      }
    },
    [
      fetchFeatureFlagSnapshot,
      fetchAssessmentStatus,
      fetchStudyStatusSnapshot,
      setDefaultAssessmentStatus,
      setDefaultStudyStatus,
    ]
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando autenticación...</p>
        </div>
      </div>
    );
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
