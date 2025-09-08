
import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/api';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = decodeJwt(token);
      if (decodedUser) {
        setIsAuthenticated(true);
        setUser(decodedUser);
      } else {
        localStorage.removeItem('token'); // Remove invalid token
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      const token = response.data.token;
      localStorage.setItem('token', token);
      const decodedUser = decodeJwt(token);
      if (decodedUser) {
        setIsAuthenticated(true);
        setUser(decodedUser);
        return true;
      } else {
        console.error('Login successful but token invalid.');
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
