import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Profile from './pages/Profile.tsx';
import Exercises from './pages/Exercises.tsx';
import Survey from './pages/Survey.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import Consent from './pages/Consent.tsx';
import IntroductoryTest from './pages/IntroductoryTest.tsx';
import ExitTest from './pages/ExitTest.tsx';
import Theory from './pages/Theory.tsx';
import Chatbot from './pages/Chatbot.tsx';
import PasswordChange from './pages/PasswordChange.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipPretestCheck?: boolean;
  requirePosttestUnlock?: boolean;
}

const ProtectedRoute = ({ children, skipPretestCheck = false, requirePosttestUnlock = false }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, assessmentStatus, studyStatus } = useAuth();
  const location = useLocation();

  const prerequisitesLoading =
    loading || !assessmentStatus.loaded || !studyStatus.loaded;

  if (prerequisitesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onPretestPage = location.pathname.startsWith('/study/pretest');
  if (!skipPretestCheck && !assessmentStatus.pretestCompleted && !onPretestPage) {
    return <Navigate to="/study/pretest" replace />;
  }

  if (requirePosttestUnlock && !studyStatus.posttestUnlocked) {
    return <Navigate to="/dashboard" replace state={{ reason: 'posttest_locked' }} />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study/consent"
          element={
            <ProtectedRoute skipPretestCheck>
              <Consent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study/pretest"
          element={
            <ProtectedRoute skipPretestCheck>
              <IntroductoryTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study/exit-test"
          element={
            <ProtectedRoute requirePosttestUnlock>
              <ExitTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercises"
          element={
            <ProtectedRoute>
              <Exercises />
            </ProtectedRoute>
          }
        />
        <Route
          path="/theory"
          element={
            <ProtectedRoute>
              <Theory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/survey"
          element={
            <ProtectedRoute>
              <Survey />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/password"
          element={
            <ProtectedRoute>
              <PasswordChange />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
