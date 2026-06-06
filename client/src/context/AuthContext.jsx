// ============================================
// AuthContext — handles global user authentication state
// ============================================
// Stores JWT token and user info in React state + localStorage.
// Provides helper functions for registration, login, and logout.
// Exposes a preconfigured Axios instance with authorization headers.

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create a customized Axios instance pointing to our backend API
export const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Axios Request Interceptor: automatically adds the JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('synapse_token');
    if (token) {
      // The backend expects "Bearer <token>" format
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Create the Context object
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if user is already logged in (by reading localStorage)
  useEffect(() => {
    const savedToken = localStorage.getItem('synapse_token');
    const savedUser = localStorage.getItem('synapse_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // --- Register Function ---
  const register = async (username, email, password) => {
    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      // Save to state
      setToken(receivedToken);
      setUser(receivedUser);

      // Save to localStorage
      localStorage.setItem('synapse_token', receivedToken);
      localStorage.setItem('synapse_user', JSON.stringify(receivedUser));

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMsg = error.response?.data?.error || 'Registration failed. Please try again.';
      return { success: false, error: errorMsg };
    }
  };

  // --- Login Function ---
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      // Save to state
      setToken(receivedToken);
      setUser(receivedUser);

      // Save to localStorage
      localStorage.setItem('synapse_token', receivedToken);
      localStorage.setItem('synapse_user', JSON.stringify(receivedUser));

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const errorMsg = error.response?.data?.error || 'Invalid email or password.';
      return { success: false, error: errorMsg };
    }
  };

  // --- Logout Function ---
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('synapse_token');
    localStorage.removeItem('synapse_user');
  };

  // --- Update User Function ---
  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('synapse_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook to consume the AuthContext easily
export const useAuth = () => {
  return useContext(AuthContext);
};
