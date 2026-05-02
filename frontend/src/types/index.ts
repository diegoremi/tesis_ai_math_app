export interface User {
  userId: number;
  role: 'student' | 'admin';
}

export interface FeatureFlags {
  participant_code: string;
  chatbot: boolean;
  adaptativo: boolean;
  assigned_group: 'GE' | 'GC' | null;
  assignment_method: string | null;
  assigned_at: string | null;
}

export interface AssessmentStatus {
  pretestCompleted: boolean;
  posttestCompleted: boolean;
  loaded: boolean;
}

export interface StudyStatus {
  modulesCompleted: number;
  checkpointsPassed: number;
  minutesInTheory: number;
  requiredModules: number;
  requiredCheckpoints: number;
  posttestUnlocked: boolean;
  consented: boolean;
  loaded: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  featureFlags: FeatureFlags | null;
  assessmentStatus: AssessmentStatus;
  studyStatus: StudyStatus;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<'dashboard' | 'pretest' | 'error'>;
  logout: () => void;
  refreshFeatureFlags: () => Promise<FeatureFlags | null>;
  refreshAssessmentStatus: () => Promise<AssessmentStatus>;
  refreshStudyStatus: () => Promise<StudyStatus | null>;
}
