
import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, logout as apiLogout, fetchFeatureFlags } from '../services/api';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = decodeJwt(token);
      if (decodedUser) {
        setIsAuthenticated(true);
        setUser(decodedUser);
        fetchFeatureFlagSnapshot();
      } else {
        localStorage.removeItem('token'); // Remove invalid token
      }
    }
    setLoading(false);
  }, []);

  const fetchFeatureFlagSnapshot = async () => {
    try {
      const response = await fetchFeatureFlags();
      setFeatureFlags(response.data);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      setFeatureFlags(null);
    }
  };

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
        return true;
      } else {
        console.error('Login successful but token invalid.');
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
        setFeatureFlags(null);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setFeatureFlags(null);
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setUser(null);
    setFeatureFlags(null);
  };

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, featureFlags, login, logout, refreshFeatureFlags: fetchFeatureFlagSnapshot }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
