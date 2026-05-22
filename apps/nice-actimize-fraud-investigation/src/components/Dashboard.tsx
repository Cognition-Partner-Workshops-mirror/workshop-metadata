/**
 * Dashboard page showing high-level fraud investigation statistics.
 * Displays KPI cards, risk distribution chart, category breakdown,
 * and recent high-priority cases for quick triage.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { FraudCase, DashboardStats } from '../types';
import { formatCurrency, formatNumber, getStatusBadgeClass, getPriorityBadgeClass } from '../utils/helpers';

interface DashboardProps {
  cases: FraudCase[];
}

/* Color palette for the pie chart slices */
const PIE_COLORS = ['#ef476f', '#ffd166', '#00b4d8', '#06d6a0', '#118ab2', '#9b5de5', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4'];

/* Inline styles for dashboard layout */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    flex: 1,
    overflow: 'auto',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#8899aa',
    marginBottom: 24,
  },
  /* Top-level KPI cards row */
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 20,
    border: '1px solid #2a3f5f',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#8899aa',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#e0e6ed',
  },
  statSubtext: {
    fontSize: 12,
    color: '#5a6d82',
    marginTop: 4,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 24,
  },
  chartCard: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 20,
    border: '1px solid #2a3f5f',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 16,
  },
  recentSection: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 20,
    border: '1px solid #2a3f5f',
  },
  recentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllBtn: {
    background: 'rgba(0, 180, 216, 0.15)',
    color: '#00b4d8',
    border: '1px solid rgba(0, 180, 216, 0.3)',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default function Dashboard({ cases }: DashboardProps) {
  const navigate = useNavigate();

  /* Compute aggregate statistics from all cases */
  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      totalCases: cases.length,
      openCases: cases.filter(c => c.status === 'Open').length,
      escalatedCases: cases.filter(c => c.status === 'Escalated').length,
      confirmedFraud: cases.filter(c => c.status === 'Closed - Confirmed Fraud').length,
      totalAmount: cases.reduce((sum, c) => sum + c.totalAmount, 0),
      avgRiskScore: Math.round(cases.reduce((sum, c) => sum + c.riskScore, 0) / cases.length),
      criticalCases: cases.filter(c => c.priority === 'Critical').length,
      casesThisMonth: cases.filter(c => c.createdDate.startsWith(thisMonth)).length,
    };
  }, [cases]);

  /* Build data for the risk-score distribution bar chart (bucketed) */
  const riskDistribution = useMemo(() => {
    const buckets = [
      { range: '0-20', count: 0, fill: '#06d6a0' },
      { range: '21-40', count: 0, fill: '#06d6a0' },
      { range: '41-60', count: 0, fill: '#00b4d8' },
      { range: '61-80', count: 0, fill: '#ffd166' },
      { range: '81-100', count: 0, fill: '#ef476f' },
    ];
    cases.forEach(c => {
      if (c.riskScore <= 20) buckets[0].count++;
      else if (c.riskScore <= 40) buckets[1].count++;
      else if (c.riskScore <= 60) buckets[2].count++;
      else if (c.riskScore <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [cases]);

  /* Build data for the fraud category pie chart */
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [cases]);

  /* Top 10 recent high-priority cases for the quick-view table */
  const recentCritical = useMemo(() => {
    return [...cases]
      .filter(c => c.priority === 'Critical' || c.priority === 'High')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
  }, [cases]);

  return (
    <div style={styles.container}>
      <div style={styles.pageTitle}>Investigation Dashboard</div>
      <div style={styles.pageSubtitle}>
        Real-time overview of fraud cases and investigation metrics
      </div>

      {/* KPI summary cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Cases</div>
          <div style={styles.statValue}>{formatNumber(stats.totalCases)}</div>
          <div style={styles.statSubtext}>{formatNumber(stats.casesThisMonth)} this month</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #ef476f' }}>
          <div style={styles.statLabel}>Critical / Escalated</div>
          <div style={{ ...styles.statValue, color: '#ef476f' }}>
            {stats.criticalCases} / {stats.escalatedCases}
          </div>
          <div style={styles.statSubtext}>Require immediate attention</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #ffd166' }}>
          <div style={styles.statLabel}>Confirmed Fraud</div>
          <div style={{ ...styles.statValue, color: '#ffd166' }}>{stats.confirmedFraud}</div>
          <div style={styles.statSubtext}>
            {formatCurrency(
              cases
                .filter(c => c.status === 'Closed - Confirmed Fraud')
                .reduce((s, c) => s + c.totalAmount, 0)
            )} total exposure
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #00b4d8' }}>
          <div style={styles.statLabel}>Avg Risk Score</div>
          <div style={{ ...styles.statValue, color: '#00b4d8' }}>{stats.avgRiskScore}</div>
          <div style={styles.statSubtext}>{formatCurrency(stats.totalAmount)} total flagged</div>
        </div>
      </div>

      {/* Charts row: risk distribution bar chart and category pie chart */}
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Risk Score Distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskDistribution}>
              <XAxis dataKey="range" stroke="#5a6d82" fontSize={12} />
              <YAxis stroke="#5a6d82" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1e2d42',
                  border: '1px solid #2a3f5f',
                  borderRadius: 6,
                  color: '#e0e6ed',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {riskDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Cases by Fraud Category</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((_entry, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1e2d42',
                  border: '1px solid #2a3f5f',
                  borderRadius: 6,
                  color: '#e0e6ed',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#8899aa' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent high-priority cases table */}
      <div style={styles.recentSection}>
        <div style={styles.recentHeader}>
          <div style={styles.chartTitle}>High Priority Cases</div>
          <button style={styles.viewAllBtn} onClick={() => navigate('/cases')}>
            View All Cases
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Category</th>
              <th>Customer</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Risk Score</th>
              <th>Amount</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {recentCritical.map(c => (
              <tr
                key={c.caseId}
                className="clickable"
                onClick={() => navigate(`/cases/${c.caseId}`)}
              >
                <td style={{ color: '#00b4d8', fontWeight: 600 }}>{c.caseId}</td>
                <td>{c.category}</td>
                <td>{c.customerName}</td>
                <td><span className={getPriorityBadgeClass(c.priority)}>{c.priority}</span></td>
                <td><span className={getStatusBadgeClass(c.status)}>{c.status}</span></td>
                <td>
                  <span style={{
                    color: c.riskScore >= 80 ? '#ef476f' : c.riskScore >= 60 ? '#ffd166' : '#00b4d8',
                    fontWeight: 700,
                  }}>
                    {c.riskScore}
                  </span>
                </td>
                <td>{formatCurrency(c.totalAmount)}</td>
                <td style={{ color: '#8899aa' }}>{c.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
