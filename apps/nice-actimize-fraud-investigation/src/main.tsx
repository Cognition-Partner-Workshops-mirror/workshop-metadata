/**
 * Application entry point. Wraps the app in React StrictMode,
 * BrowserRouter for client-side routing, AuthProvider for authentication,
 * EscalationProvider for case escalation, and SarProvider for SAR workflow.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { EscalationProvider } from './context/EscalationContext';
import { SarProvider } from './context/SarContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* AuthProvider → EscalationProvider → SarProvider hierarchy */}
      <AuthProvider>
        <EscalationProvider>
          <SarProvider>
            <App />
          </SarProvider>
        </EscalationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
