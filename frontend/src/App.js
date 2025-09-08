import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Exercises from './components/Exercises';
import Survey from './components/Survey';
import AdminDashboard from './components/AdminDashboard';
import Register from './components/auth/Register';
import './App.css';

// Simple ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); // Use isAuthenticated from context

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // Redirect to login if not authenticated
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