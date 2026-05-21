/**
 * Escalation context for managing case escalation state.
 * Tracks which cases have been escalated, by whom, and for what reason.
 * Analysts cannot view escalated cases; senior analysts see only escalated ones.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

/* Metadata stored for each escalated case */
export interface EscalationRecord {
  caseId: string;
  escalatedBy: string; // username of the analyst who escalated
  escalatedByName: string; // display name of the analyst
  reason: string;
  notes: string;
  escalatedAt: string; // ISO timestamp
}

interface EscalationContextType {
  escalations: Map<string, EscalationRecord>;
  escalateCase: (record: Omit<EscalationRecord, 'escalatedAt'>) => void;
  isEscalated: (caseId: string) => boolean;
  getEscalation: (caseId: string) => EscalationRecord | undefined;
}

const EscalationContext = createContext<EscalationContextType>({
  escalations: new Map(),
  escalateCase: () => {},
  isEscalated: () => false,
  getEscalation: () => undefined,
});

/* Hook to access escalation state from any component */
export function useEscalation(): EscalationContextType {
  return useContext(EscalationContext);
}

interface EscalationProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app tree and provides escalation state management.
 * Uses an in-memory Map keyed by caseId for O(1) lookups.
 */
export function EscalationProvider({ children }: EscalationProviderProps) {
  const [escalations, setEscalations] = useState<Map<string, EscalationRecord>>(new Map());

  /* Marks a case as escalated and stores the metadata */
  const escalateCase = useCallback((record: Omit<EscalationRecord, 'escalatedAt'>) => {
    setEscalations(prev => {
      const next = new Map(prev);
      next.set(record.caseId, {
        ...record,
        escalatedAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  /* Checks if a case has been escalated */
  const isEscalated = useCallback((caseId: string): boolean => {
    return escalations.has(caseId);
  }, [escalations]);

  /* Returns the escalation record for a case, if any */
  const getEscalation = useCallback((caseId: string): EscalationRecord | undefined => {
    return escalations.get(caseId);
  }, [escalations]);

  return (
    <EscalationContext.Provider value={{ escalations, escalateCase, isEscalated, getEscalation }}>
      {children}
    </EscalationContext.Provider>
  );
}
