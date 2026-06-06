// ============================================
// main.jsx — Application Entry Point
// ============================================
// This is the very first file that runs.
// It renders the root <App /> component into the DOM,
// wrapped with AuthProvider (global auth state) and
// BrowserRouter (client-side routing).

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './App.css';

// React 18's createRoot API for concurrent features
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
