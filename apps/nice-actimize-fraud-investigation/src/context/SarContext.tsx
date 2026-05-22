/**
 * SAR (Suspicious Activity Report) context for managing SAR lifecycle.
 * Tracks SAR creation, review, approval, and filing workflow.
 * Also tracks which escalated cases have been referred for SAR filing
 * by a senior analyst, making them visible to SAR analysts.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { SarReport, SarStatus } from '../types';

/* Record for a case that has been referred for SAR by a senior analyst */
export interface SarReferral {
  caseId: string;
  referredBy: string;
  referredByName: string;
  referredAt: string;
}

interface SarContextType {
  /* SAR reports keyed by sarId */
  sars: Map<string, SarReport>;
  /* Cases referred for SAR keyed by caseId */
  referrals: Map<string, SarReferral>;
  /* Senior analyst refers an escalated case for SAR filing */
  referForSar: (referral: Omit<SarReferral, 'referredAt'>) => void;
  /* Check if a case has been referred for SAR */
  isReferredForSar: (caseId: string) => boolean;
  /* Get referral record for a case */
  getReferral: (caseId: string) => SarReferral | undefined;
  /* SAR analyst creates a new SAR for a referred case */
  createSar: (sar: SarReport) => void;
  /* Get SAR by sarId */
  getSar: (sarId: string) => SarReport | undefined;
  /* Get SAR for a specific case (returns first match) */
  getSarForCase: (caseId: string) => SarReport | undefined;
  /* SAR analyst submits draft for review */
  submitForReview: (sarId: string) => void;
  /* SAR supervisor approves a SAR */
  approveSar: (sarId: string, reviewedBy: string, reviewedByName: string, notes: string) => void;
  /* SAR supervisor requests revision */
  requestRevision: (sarId: string, reviewedBy: string, reviewedByName: string, notes: string) => void;
  /* SAR supervisor files the approved SAR */
  fileSar: (sarId: string) => void;
  /* Update SAR fields (for editing drafts or revisions) */
  updateSar: (sarId: string, updates: Partial<SarReport>) => void;
  /* Get all SARs as array */
  getAllSars: () => SarReport[];
  /* Generate next SAR ID */
  nextSarId: () => string;
}

const SarContext = createContext<SarContextType>({
  sars: new Map(),
  referrals: new Map(),
  referForSar: () => {},
  isReferredForSar: () => false,
  getReferral: () => undefined,
  createSar: () => {},
  getSar: () => undefined,
  getSarForCase: () => undefined,
  submitForReview: () => {},
  approveSar: () => {},
  requestRevision: () => {},
  fileSar: () => {},
  updateSar: () => {},
  getAllSars: () => [],
  nextSarId: () => '',
});

/* Hook to access SAR state from any component */
export function useSar(): SarContextType {
  return useContext(SarContext);
}

interface SarProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app tree and provides SAR state management.
 * Manages the full SAR lifecycle: referral → create → submit → review → file.
 */
export function SarProvider({ children }: SarProviderProps) {
  const [sars, setSars] = useState<Map<string, SarReport>>(new Map());
  const [referrals, setReferrals] = useState<Map<string, SarReferral>>(new Map());
  const [sarCounter, setSarCounter] = useState(1);

  /* Senior analyst refers a case for SAR filing */
  const referForSar = useCallback((referral: Omit<SarReferral, 'referredAt'>) => {
    setReferrals(prev => {
      const next = new Map(prev);
      next.set(referral.caseId, {
        ...referral,
        referredAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  const isReferredForSar = useCallback((caseId: string): boolean => {
    return referrals.has(caseId);
  }, [referrals]);

  const getReferral = useCallback((caseId: string): SarReferral | undefined => {
    return referrals.get(caseId);
  }, [referrals]);

  /* Generate a sequential SAR ID */
  const nextSarId = useCallback((): string => {
    const id = `SAR-${String(sarCounter).padStart(5, '0')}`;
    setSarCounter(prev => prev + 1);
    return id;
  }, [sarCounter]);

  /* SAR analyst creates a new draft SAR */
  const createSar = useCallback((sar: SarReport) => {
    setSars(prev => {
      const next = new Map(prev);
      next.set(sar.sarId, sar);
      return next;
    });
  }, []);

  const getSar = useCallback((sarId: string): SarReport | undefined => {
    return sars.get(sarId);
  }, [sars]);

  const getSarForCase = useCallback((caseId: string): SarReport | undefined => {
    for (const sar of sars.values()) {
      if (sar.caseId === caseId) return sar;
    }
    return undefined;
  }, [sars]);

  /* Helper to update a SAR's status and metadata */
  const updateSarStatus = useCallback((sarId: string, status: SarStatus, extra?: Partial<SarReport>) => {
    setSars(prev => {
      const next = new Map(prev);
      const existing = next.get(sarId);
      if (existing) {
        next.set(sarId, {
          ...existing,
          ...extra,
          status,
          lastUpdatedAt: new Date().toISOString(),
        });
      }
      return next;
    });
  }, []);

  /* SAR analyst submits a draft for supervisor review */
  const submitForReview = useCallback((sarId: string) => {
    updateSarStatus(sarId, 'Pending Review');
  }, [updateSarStatus]);

  /* SAR supervisor approves a SAR */
  const approveSar = useCallback((sarId: string, reviewedBy: string, reviewedByName: string, notes: string) => {
    updateSarStatus(sarId, 'Approved', { reviewedBy, reviewedByName, reviewNotes: notes });
  }, [updateSarStatus]);

  /* SAR supervisor sends a SAR back for revision */
  const requestRevision = useCallback((sarId: string, reviewedBy: string, reviewedByName: string, notes: string) => {
    updateSarStatus(sarId, 'Revision Requested', { reviewedBy, reviewedByName, reviewNotes: notes });
  }, [updateSarStatus]);

  /* SAR supervisor files the approved SAR with FinCEN */
  const fileSar = useCallback((sarId: string) => {
    updateSarStatus(sarId, 'Filed', { filingDate: new Date().toISOString() });
  }, [updateSarStatus]);

  /* Update arbitrary fields on a SAR (for editing) */
  const updateSar = useCallback((sarId: string, updates: Partial<SarReport>) => {
    setSars(prev => {
      const next = new Map(prev);
      const existing = next.get(sarId);
      if (existing) {
        next.set(sarId, { ...existing, ...updates, lastUpdatedAt: new Date().toISOString() });
      }
      return next;
    });
  }, []);

  const getAllSars = useCallback((): SarReport[] => {
    return Array.from(sars.values());
  }, [sars]);

  return (
    <SarContext.Provider value={{
      sars,
      referrals,
      referForSar,
      isReferredForSar,
      getReferral,
      createSar,
      getSar,
      getSarForCase,
      submitForReview,
      approveSar,
      requestRevision,
      fileSar,
      updateSar,
      getAllSars,
      nextSarId,
    }}>
      {children}
    </SarContext.Provider>
  );
}
