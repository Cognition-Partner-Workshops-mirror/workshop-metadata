/**
 * Authentication context for role-based access control.
 * Manages login/logout state and provides the current user to all components.
 * Supports four roles: analyst, senior_analyst, sar_analyst, sar_supervisor.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

/* Hardcoded demo user credentials for the prototype */
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  analyst1: {
    password: 'analyst123',
    user: {
      username: 'analyst1',
      displayName: 'Sarah Mitchell',
      role: 'analyst',
      initials: 'SM',
    },
  },
  analyst2: {
    password: 'analyst456',
    user: {
      username: 'analyst2',
      displayName: 'James Rodriguez',
      role: 'analyst',
      initials: 'JR',
    },
  },
  senior1: {
    password: 'senior789',
    user: {
      username: 'senior1',
      displayName: 'Emily Chen',
      role: 'senior_analyst',
      initials: 'EC',
    },
  },
  /* SAR Analyst — creates and edits Suspicious Activity Reports */
  sar1: {
    password: 'sar123',
    user: {
      username: 'sar1',
      displayName: 'Michael Torres',
      role: 'sar_analyst',
      initials: 'MT',
    },
  },
  /* SAR Supervisor — reviews, approves, and files SARs with FinCEN */
  sarsup1: {
    password: 'sarsup456',
    user: {
      username: 'sarsup1',
      displayName: 'Laura Kim',
      role: 'sar_supervisor',
      initials: 'LK',
    },
  },
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => string | null;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => 'Not initialized',
  logout: () => {},
  isAuthenticated: false,
});

/* Hook to access auth state from any component */
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app tree and provides authentication state.
 * login() returns null on success or an error message on failure.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  /* Validates credentials and sets the authenticated user */
  const login = useCallback((username: string, password: string): string | null => {
    const entry = DEMO_USERS[username];
    if (!entry) {
      return 'Invalid username. Please try again.';
    }
    if (entry.password !== password) {
      return 'Incorrect password. Please try again.';
    }
    setUser(entry.user);
    return null;
  }, []);

  /* Clears the current session */
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: user !== null }}>
      {children}
    </AuthContext.Provider>
  );
}
