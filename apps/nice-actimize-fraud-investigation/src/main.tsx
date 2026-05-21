/**
 * Application entry point. Wraps the app in React StrictMode,
 * BrowserRouter for client-side routing, AuthProvider for
 * authentication, and EscalationProvider for case escalation state.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { EscalationProvider } from './context/EscalationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* AuthProvider must wrap EscalationProvider so auth state is available */}
      <AuthProvider>
        <EscalationProvider>
          <App />
        </EscalationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
