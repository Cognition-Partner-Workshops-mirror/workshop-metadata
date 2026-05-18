/**
 * Root application component for NICE Actimize Fraud Investigation.
 * Sets up routing between the Dashboard, Cases list, and Case Detail views.
 * Generates sample fraud case data on initial load.
 */

import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CasesList from './components/CasesList';
import CaseDetail from './components/CaseDetail';
import { generateCases } from './data/generateData';

function App() {
  /* Generate 100 sample fraud cases once on mount (memoized) */
  const cases = useMemo(() => generateCases(), []);

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

export default App;
