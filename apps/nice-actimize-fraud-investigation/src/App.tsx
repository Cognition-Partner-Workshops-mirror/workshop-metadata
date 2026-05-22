/**
 * Root application component for NICE Actimize Fraud Investigation.
 * Sets up routing between Dashboard, Cases, Case Detail, SAR Dashboard,
 * and SAR Form views. Wraps the app in AuthProvider, EscalationProvider,
 * and SarProvider for role-based access and workflow management.
 */

import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CasesList from './components/CasesList';
import CaseDetail from './components/CaseDetail';
import LoginPage from './components/LoginPage';
import SarDashboard from './components/SarDashboard';
import SarForm from './components/SarForm';
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
   * - sar_analyst / sar_supervisor: sees all escalated cases (for SAR context)
   */
  const cases = useMemo(() => {
    if (!user) return allCases;
    if (user.role === 'senior_analyst' || user.role === 'sar_analyst' || user.role === 'sar_supervisor') {
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
        {/* SAR Dashboard — shows SAR list and referred cases */}
        <Route path="/sar" element={<SarDashboard cases={allCases} />} />
        {/* SAR creation/edit form for a specific case */}
        <Route path="/sar/create/:caseId" element={<SarForm cases={allCases} />} />
        {/* Redirect unknown routes to the dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
