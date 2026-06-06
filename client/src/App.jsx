// ============================================
// App.jsx — Router & Route Definitions
// ============================================
// Defines all the pages in the app and handles
// navigation between them using React Router v6.
// Includes protected route logic — if the user is
// not logged in, they get redirected to /login.

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppPage from './pages/AppPage';

// ---- Protected Route Wrapper ----
// If the user is logged in → show the page
// If not → redirect to /login
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// ---- Guest Route Wrapper ----
// If the user is already logged in → send them to /app
// (so they don't see login/register when already authenticated)
function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Auth pages — only accessible when NOT logged in */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Main app — only accessible when logged in */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppPage />
          </ProtectedRoute>
        }
      />

      {/* Default: redirect to /app (which will redirect to /login if needed) */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
