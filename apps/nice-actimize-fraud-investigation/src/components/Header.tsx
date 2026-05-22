/**
 * Application header with NICE Actimize branding, navigation, and user info.
 * Displays the current logged-in user's name, role badge, and a logout button.
 * Role badge colors: teal (analyst), gold (senior), green (SAR analyst), purple (SAR supervisor).
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* Inline styles for the header to keep it self-contained */
const styles: Record<string, React.CSSProperties> = {
  header: {
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 100%)',
    borderBottom: '2px solid #00b4d8',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
  },
  /* NICE Actimize shield/logo icon rendered as an SVG-style container */
  logoIcon: {
    width: 36,
    height: 36,
    background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 800,
    color: '#0a1628',
    letterSpacing: -1,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#00b4d8',
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  nav: {
    display: 'flex',
    gap: 4,
  },
  navBtn: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#8899aa',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navBtnActive: {
    padding: '8px 16px',
    background: 'rgba(0, 180, 216, 0.15)',
    color: '#00b4d8',
    border: '1px solid rgba(0, 180, 216, 0.3)',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#8899aa',
    fontSize: 13,
  },
  /* Avatar circle for the logged-in investigator */
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00b4d8, #06d6a0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#0a1628',
  },
  /* Role badge to distinguish analyst from senior analyst */
  roleBadge: {
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  /* Determine which nav item is currently active based on the route path */
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  /* Role badge styling varies by role for visual distinction */
  const roleBadgeColors: Record<string, { bg: string; color: string; border: string }> = {
    analyst: { bg: 'rgba(0, 180, 216, 0.15)', color: '#00b4d8', border: 'rgba(0, 180, 216, 0.3)' },
    senior_analyst: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    sar_analyst: { bg: 'rgba(6, 214, 160, 0.15)', color: '#06d6a0', border: 'rgba(6, 214, 160, 0.3)' },
    sar_supervisor: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  };
  const badgeColor = roleBadgeColors[user?.role ?? 'analyst'];
  const roleBadgeStyle: React.CSSProperties = {
    ...styles.roleBadge,
    background: badgeColor.bg,
    color: badgeColor.color,
    border: `1px solid ${badgeColor.border}`,
  };

  /* Format role label for display */
  const roleLabels: Record<string, string> = {
    analyst: 'Analyst',
    senior_analyst: 'Senior Analyst',
    sar_analyst: 'SAR Analyst',
    sar_supervisor: 'SAR Supervisor',
  };
  const roleLabel = roleLabels[user?.role ?? 'analyst'];

  /* SAR nav is visible to sar_analyst, sar_supervisor, and senior_analyst */
  const showSarNav = user?.role === 'sar_analyst' || user?.role === 'sar_supervisor' || user?.role === 'senior_analyst';

  return (
    <header style={styles.header}>
      {/* Branding area with logo icon and application name */}
      <div style={styles.logoSection} onClick={() => navigate('/')}>
        <div style={styles.logoIcon}>NA</div>
        <div>
          <div style={styles.title}>NICE Actimize</div>
          <div style={styles.subtitle}>Fraud Investigation</div>
        </div>
      </div>

      {/* Main navigation links */}
      <nav style={styles.nav}>
        <button
          style={isActive('/') ? styles.navBtnActive : styles.navBtn}
          onClick={() => navigate('/')}
        >
          Dashboard
        </button>
        <button
          style={isActive('/cases') ? styles.navBtnActive : styles.navBtn}
          onClick={() => navigate('/cases')}
        >
          Cases
        </button>
        {/* SAR nav link visible to SAR team and senior analysts */}
        {showSarNav && (
          <button
            style={isActive('/sar') ? styles.navBtnActive : styles.navBtn}
            onClick={() => navigate('/sar')}
          >
            SAR Filing
          </button>
        )}
      </nav>

      {/* Logged-in user info with role badge and logout */}
      <div style={styles.userSection}>
        <div style={styles.avatar}>{user?.initials ?? '??'}</div>
        <div>
          <div style={{ color: '#e0e8f0', fontWeight: 600 }}>{user?.displayName}</div>
          <span style={roleBadgeStyle}>{roleLabel}</span>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
