import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Exercises from './components/Exercises';
import Survey from './components/Survey';
import AdminDashboard from './components/AdminDashboard';
import Register from './components/auth/Register';
import Consent from './components/study/Consent';
import IntroductoryTest from './components/study/IntroductoryTest';
import ExitTest from './components/study/ExitTest';
import Theory from './components/Theory';
import './App.css';

// Simple ProtectedRoute component
const ProtectedRoute = ({ children, skipPretestCheck = false, requirePosttestUnlock = false }) => {
  const { isAuthenticated, loading, assessmentStatus, studyStatus } = useAuth();
  const location = useLocation();

  const prerequisitesLoading =
    loading ||
    !assessmentStatus.loaded ||
    !studyStatus.loaded;

  if (prerequisitesLoading) {
    return <LoadingSpinner label="Cargando autenticación…" fullscreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // Redirect to login if not authenticated
  }
  const onPretestPage = location.pathname.startsWith('/study/pretest');
  if (!skipPretestCheck && !assessmentStatus.pretestCompleted && !onPretestPage) {
    return <Navigate to="/study/pretest" replace />;
  }

  if (requirePosttestUnlock && !studyStatus.posttestUnlocked) {
    return <Navigate to="/dashboard" replace state={{ reason: 'posttest_locked' }} />;
  }
  return children;
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected Routes */}
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
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </header>
    </div>
  );
}

export default App;
