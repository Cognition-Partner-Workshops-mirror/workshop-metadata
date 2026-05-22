/**
 * Login page component for the fraud investigation application.
 * Supports two analyst roles with distinct credentials.
 * Displays available demo accounts below the login form for easy testing.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

/* Inline styles scoped to the login page */
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 60%, #0d2137 100%)',
  },
  card: {
    background: '#111d2e',
    borderRadius: 16,
    padding: '48px 40px',
    width: 420,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    border: '1px solid #1e3250',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  logoIcon: {
    width: 48,
    height: 48,
    background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 800,
    color: '#0a1628',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#ffffff',
  },
  logoSub: {
    fontSize: 11,
    color: '#00b4d8',
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#8899aa',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 8,
    color: '#e0e8f0',
    fontSize: 14,
    outline: 'none',
    marginBottom: 20,
    boxSizing: 'border-box' as const,
  },
  submitBtn: {
    width: '100%',
    padding: '12px 0',
    background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
    border: 'none',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  error: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16,
  },
  demoCreds: {
    marginTop: 28,
    padding: '16px',
    background: 'rgba(0, 180, 216, 0.06)',
    borderRadius: 8,
    border: '1px solid rgba(0, 180, 216, 0.15)',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#00b4d8',
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  demoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#8899aa',
    padding: '4px 0',
  },
  demoLabel: {
    color: '#e0e8f0',
    fontWeight: 600,
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  /* Validates the form and attempts to log the user in */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const errorMsg = login(username.trim(), password);
    if (errorMsg) {
      setError(errorMsg);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* NICE Actimize branding */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>NA</div>
          <div>
            <div style={styles.logoTitle}>NICE Actimize</div>
            <div style={styles.logoSub}>Fraud Investigation</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoFocus
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <button type="submit" style={styles.submitBtn}>Sign In</button>
        </form>

        {/* Demo credentials for testers */}
        <div style={styles.demoCreds}>
          <div style={styles.demoTitle}>Demo Accounts</div>
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>Analyst 1</span>
            <span>analyst1 / analyst123</span>
          </div>
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>Analyst 2</span>
            <span>analyst2 / analyst456</span>
          </div>
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>Senior Analyst</span>
            <span>senior1 / senior789</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(0,180,216,0.15)', marginTop: 8, paddingTop: 8 }}>
            <div style={{ ...styles.demoTitle, marginBottom: 6 }}>SAR Team</div>
          </div>
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>SAR Analyst</span>
            <span>sar1 / sar123</span>
          </div>
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>SAR Supervisor</span>
            <span>sarsup1 / sarsup456</span>
          </div>
        </div>
      </div>
    </div>
  );
}
