/**
 * SAR Dashboard page displaying all SARs and referred cases.
 * - SAR Analysts see referred cases awaiting SAR creation and their drafts.
 * - SAR Supervisors see SARs pending review and can approve/reject/file them.
 * Shows SAR status KPIs and a filterable list of all SAR records.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FraudCase, SarReport, SarStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSar } from '../context/SarContext';
import { useEscalation } from '../context/EscalationContext';
import { formatCurrency, formatDate } from '../utils/helpers';

interface SarDashboardProps {
  cases: FraudCase[];
}

/* Inline styles for the SAR dashboard */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    flex: 1,
    overflow: 'auto',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#5a6d82',
    marginBottom: 20,
  },
  /* KPI summary cards row */
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 16,
    border: '1px solid #2a3f5f',
    textAlign: 'center' as const,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#5a6d82',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 12,
    marginTop: 8,
  },
  /* Referred cases cards for SAR analysts */
  referredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  referredCard: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 16,
    border: '1px solid rgba(245, 158, 11, 0.3)',
    cursor: 'pointer',
  },
  referredCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#f59e0b',
    marginBottom: 6,
  },
  referredCardText: {
    fontSize: 12,
    color: '#8899aa',
    lineHeight: 1.6,
  },
  createSarBtn: {
    marginTop: 10,
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #06d6a0, #059669)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  /* Filter row for SAR list */
  filterRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  filterSelect: {
    padding: '6px 10px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 6,
    color: '#e0e8f0',
    fontSize: 12,
  },
  /* SAR table styles */
  tableCard: {
    background: '#1e2d42',
    borderRadius: 10,
    border: '1px solid #2a3f5f',
    overflow: 'hidden',
  },
  /* Status badge colors for different SAR statuses */
  badge: {
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
  },
  /* Review modal overlay */
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalCard: {
    background: '#111d2e',
    borderRadius: 16,
    padding: '32px',
    width: 520,
    border: '1px solid #2a3f5f',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 16,
  },
  modalLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#8899aa',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  modalTextarea: {
    width: '100%',
    padding: '10px 14px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 8,
    color: '#e0e8f0',
    fontSize: 14,
    minHeight: 80,
    resize: 'vertical' as const,
    marginBottom: 20,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#8899aa',
    border: '1px solid #2a3f5f',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  approveBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #06d6a0, #059669)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  revisionBtn: {
    padding: '10px 20px',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  fileBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#5a6d82',
    fontSize: 14,
  },
};

/* Returns badge style based on SAR status */
function getSarStatusStyle(status: SarStatus): React.CSSProperties {
  const colorMap: Record<SarStatus, { bg: string; color: string; border: string }> = {
    'Draft': { bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: 'rgba(107, 114, 128, 0.3)' },
    'Pending Review': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    'Revision Requested': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    'Approved': { bg: 'rgba(6, 214, 160, 0.15)', color: '#06d6a0', border: 'rgba(6, 214, 160, 0.3)' },
    'Filed': { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  };
  const c = colorMap[status];
  return { ...styles.badge, background: c.bg, color: c.color, border: `1px solid ${c.border}` };
}

export default function SarDashboard({ cases }: SarDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAllSars, getSarForCase, approveSar, requestRevision, fileSar, submitForReview, referrals } = useSar();
  const { escalations } = useEscalation();

  const [statusFilter, setStatusFilter] = useState<SarStatus | 'All'>('All');
  /* Review modal state */
  const [reviewSar, setReviewSar] = useState<SarReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const allSars = getAllSars();

  /* KPI calculations */
  const kpis = useMemo(() => {
    const drafts = allSars.filter(s => s.status === 'Draft').length;
    const pending = allSars.filter(s => s.status === 'Pending Review').length;
    const approved = allSars.filter(s => s.status === 'Approved').length;
    const filed = allSars.filter(s => s.status === 'Filed').length;
    const revisions = allSars.filter(s => s.status === 'Revision Requested').length;
    return { drafts, pending, approved, filed, revisions, total: allSars.length };
  }, [allSars]);

  /* Filtered SAR list */
  const filteredSars = useMemo(() => {
    if (statusFilter === 'All') return allSars;
    return allSars.filter(s => s.status === statusFilter);
  }, [allSars, statusFilter]);

  /* Cases referred for SAR but without a SAR created yet (for SAR analysts) */
  const unreportedReferrals = useMemo(() => {
    const results: { caseId: string; fraudCase: FraudCase | undefined; referredByName: string; referredAt: string }[] = [];
    for (const [caseId, ref] of referrals.entries()) {
      if (!getSarForCase(caseId)) {
        results.push({
          caseId,
          fraudCase: cases.find(c => c.caseId === caseId),
          referredByName: ref.referredByName,
          referredAt: ref.referredAt,
        });
      }
    }
    return results;
  }, [referrals, getSarForCase, cases]);

  /* Handle supervisor review actions */
  const handleApprove = () => {
    if (reviewSar) {
      approveSar(reviewSar.sarId, user!.username, user!.displayName, reviewNotes);
      setReviewSar(null);
      setReviewNotes('');
    }
  };

  const handleRequestRevision = () => {
    if (reviewSar && reviewNotes.trim()) {
      requestRevision(reviewSar.sarId, user!.username, user!.displayName, reviewNotes);
      setReviewSar(null);
      setReviewNotes('');
    }
  };

  const handleFile = (sarId: string) => {
    fileSar(sarId);
  };

  /* Determine page subtitle based on role */
  const roleSubtitle = user?.role === 'sar_analyst'
    ? 'Create and manage Suspicious Activity Reports for referred cases'
    : user?.role === 'sar_supervisor'
      ? 'Review, approve, and file Suspicious Activity Reports'
      : 'View SAR filing status for escalated cases';

  return (
    <div style={styles.container}>
      <div style={styles.pageTitle}>SAR Dashboard</div>
      <div style={styles.pageSubtitle}>{roleSubtitle}</div>

      {/* KPI Summary Cards */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: '#e0e8f0' }}>{kpis.total}</div>
          <div style={styles.kpiLabel}>Total SARs</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: '#9ca3af' }}>{kpis.drafts}</div>
          <div style={styles.kpiLabel}>Drafts</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: '#f59e0b' }}>{kpis.pending}</div>
          <div style={styles.kpiLabel}>Pending Review</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: '#06d6a0' }}>{kpis.approved}</div>
          <div style={styles.kpiLabel}>Approved</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: '#8b5cf6' }}>{kpis.filed}</div>
          <div style={styles.kpiLabel}>Filed</div>
        </div>
      </div>

      {/* Referred cases awaiting SAR creation (SAR Analyst view) */}
      {user?.role === 'sar_analyst' && unreportedReferrals.length > 0 && (
        <>
          <div style={styles.sectionTitle}>Cases Awaiting SAR</div>
          <div style={styles.referredGrid}>
            {unreportedReferrals.map(ref => (
              <div key={ref.caseId} style={styles.referredCard}>
                <div style={styles.referredCardTitle}>{ref.caseId}</div>
                <div style={styles.referredCardText}>
                  {ref.fraudCase?.caseName ?? 'Unknown case'}<br />
                  <strong>Customer:</strong> {ref.fraudCase?.customerName}<br />
                  <strong>Amount:</strong> {ref.fraudCase ? formatCurrency(ref.fraudCase.totalAmount) : 'N/A'}<br />
                  <strong>Referred by:</strong> {ref.referredByName}<br />
                  <strong>Referred:</strong> {formatDate(ref.referredAt)}
                </div>
                <button
                  style={styles.createSarBtn}
                  onClick={() => navigate(`/sar/create/${ref.caseId}`)}
                >
                  Create SAR
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SAR Records Table */}
      <div style={styles.sectionTitle}>SAR Records</div>
      <div style={styles.filterRow}>
        <span style={{ fontSize: 12, color: '#5a6d82' }}>Filter by status:</span>
        <select style={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value as SarStatus | 'All')}>
          <option value="All">All</option>
          <option value="Draft">Draft</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Revision Requested">Revision Requested</option>
          <option value="Approved">Approved</option>
          <option value="Filed">Filed</option>
        </select>
        <span style={{ fontSize: 12, color: '#5a6d82', marginLeft: 'auto' }}>
          {filteredSars.length} record{filteredSars.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredSars.length === 0 ? (
        <div style={styles.emptyState}>
          {allSars.length === 0
            ? 'No SARs have been created yet. Referred cases will appear above when available.'
            : 'No SARs match the selected filter.'}
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SAR ID</th>
                  <th>Case ID</th>
                  <th>Subject</th>
                  <th>Activity Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSars.map(sar => (
                  <tr key={sar.sarId}>
                    <td style={{ color: '#00b4d8', fontWeight: 600 }}>{sar.sarId}</td>
                    <td>{sar.caseId}</td>
                    <td>{sar.subjectName}</td>
                    <td>{sar.activityType}</td>
                    <td>{formatCurrency(sar.totalAmountInvolved)}</td>
                    <td><span style={getSarStatusStyle(sar.status)}>{sar.status}</span></td>
                    <td>{sar.createdByName}</td>
                    <td>{formatDate(sar.lastUpdatedAt)}</td>
                    <td>
                      {/* SAR Analyst can edit drafts and revision-requested SARs */}
                      {user?.role === 'sar_analyst' && (sar.status === 'Draft' || sar.status === 'Revision Requested') && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={{ ...styles.createSarBtn, padding: '4px 10px', fontSize: 11 }}
                            onClick={() => navigate(`/sar/create/${sar.caseId}`)}
                          >
                            Edit
                          </button>
                          {/* Quick submit button so analyst can submit directly from dashboard */}
                          <button
                            style={{ ...styles.approveBtn, padding: '4px 10px', fontSize: 11 }}
                            onClick={() => submitForReview(sar.sarId)}
                          >
                            Submit
                          </button>
                        </div>
                      )}
                      {/* SAR Supervisor can review pending SARs */}
                      {user?.role === 'sar_supervisor' && sar.status === 'Pending Review' && (
                        <button
                          style={{ ...styles.approveBtn, padding: '4px 10px', fontSize: 11 }}
                          onClick={() => { setReviewSar(sar); setReviewNotes(''); }}
                        >
                          Review
                        </button>
                      )}
                      {/* SAR Supervisor can file approved SARs */}
                      {user?.role === 'sar_supervisor' && sar.status === 'Approved' && (
                        <button
                          style={{ ...styles.fileBtn, padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleFile(sar.sarId)}
                        >
                          File with FinCEN
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supervisor Review Modal */}
      {reviewSar && (
        <div style={styles.modalOverlay} onClick={() => setReviewSar(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Review SAR: {reviewSar.sarId}</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#8899aa', lineHeight: 1.8 }}>
                <strong>Case:</strong> {reviewSar.caseId}<br />
                <strong>Subject:</strong> {reviewSar.subjectName}<br />
                <strong>Activity:</strong> {reviewSar.activityType}<br />
                <strong>Amount:</strong> {formatCurrency(reviewSar.totalAmountInvolved)}<br />
                <strong>Created by:</strong> {reviewSar.createdByName}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={styles.modalLabel}>Narrative Preview</div>
              <div style={{
                background: '#0a1628',
                borderRadius: 6,
                padding: 12,
                fontSize: 12,
                color: '#8899aa',
                lineHeight: 1.6,
                maxHeight: 120,
                overflowY: 'auto',
                border: '1px solid #1e3250',
              }}>
                {reviewSar.narrative || 'No narrative provided.'}
              </div>
            </div>

            <label style={styles.modalLabel}>Review Notes</label>
            <textarea
              style={styles.modalTextarea}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Add review comments (required for revision requests)..."
            />

            <div style={styles.modalActions}>
              <button style={styles.modalCancel} onClick={() => setReviewSar(null)}>Cancel</button>
              <button style={styles.revisionBtn} onClick={handleRequestRevision}>
                Request Revision
              </button>
              <button style={styles.approveBtn} onClick={handleApprove}>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
