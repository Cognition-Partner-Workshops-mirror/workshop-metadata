/**
 * Root application component for NICE Actimize Fraud Investigation.
 * Sets up routing between the Dashboard, Cases list, and Case Detail views.
 * Wraps the app in AuthProvider and EscalationProvider for role-based access.
 * Analysts see only non-escalated cases; senior analysts see only escalated cases.
 */

import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CasesList from './components/CasesList';
import CaseDetail from './components/CaseDetail';
import LoginPage from './components/LoginPage';
import { generateCases } from './data/generateData';
import { useAuth } from './context/AuthContext';
import { useEscalation } from './context/EscalationContext';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const { isEscalated } = useEscalation();

  /* Generate 100 sample fraud cases once on mount (memoized) */
  const allCases = useMemo(() => generateCases(), []);

  /**
   * Filter cases based on the current user's role:
   * - analyst: sees only non-escalated cases
   * - senior_analyst: sees only escalated cases
   */
  const cases = useMemo(() => {
    if (!user) return allCases;
    if (user.role === 'senior_analyst') {
      return allCases.filter(c => isEscalated(c.caseId));
    }
    /* Regular analysts see only cases that have NOT been escalated */
    return allCases.filter(c => !isEscalated(c.caseId));
  }, [allCases, user, isEscalated]);

  /* Show login page if user is not authenticated */
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      <Header />
      <Routes>
        {/* Dashboard overview page */}
        <Route path="/" element={<Dashboard cases={cases} />} />
        {/* Full cases list with filtering */}
        <Route path="/cases" element={<CasesList cases={cases} />} />
        {/* Individual case detail with transactions */}
        <Route path="/cases/:caseId" element={<CaseDetail cases={cases} />} />
        {/* Redirect unknown routes to the dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
