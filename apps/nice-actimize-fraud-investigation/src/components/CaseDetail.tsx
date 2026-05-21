/**
 * Case detail page showing full case information and its transaction list.
 * Generates and displays ~1000 transactions per case with filtering,
 * sorting, and pagination. Includes case summary cards and transaction
 * analytics (type/status breakdown).
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type {
  FraudCase, Transaction, TransactionFilters, SortConfig,
  TransactionType, TransactionStatus, RiskLevel,
} from '../types';
import { generateTransactionsForCase } from '../data/generateData';
import {
  formatCurrency, formatDate, formatNumber,
  getStatusBadgeClass, getPriorityBadgeClass,
  getTransactionStatusBadgeClass, getRiskScoreColor,
} from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useEscalation } from '../context/EscalationContext';

interface CaseDetailProps {
  cases: FraudCase[];
}

/* Default transaction filters (no filtering applied) */
const DEFAULT_TXN_FILTERS: TransactionFilters = {
  search: '',
  type: 'All',
  status: 'All',
  riskLevel: 'All',
  amountMin: 0,
  amountMax: 0,
  dateFrom: '',
  dateTo: '',
  country: '',
};

const TXN_PAGE_SIZE = 25;

/* Transaction type options for the dropdown filter */
const TXN_TYPES: (TransactionType | 'All')[] = [
  'All', 'Wire', 'ACH', 'Check', 'Card', 'Cash',
  'Internal Transfer', 'Foreign Exchange', 'Trade', 'Loan Payment', 'Fee',
];

/* Transaction status options for the dropdown filter */
const TXN_STATUSES: (TransactionStatus | 'All')[] = [
  'All', 'Completed', 'Pending', 'Failed', 'Reversed', 'Blocked',
];

/* Risk level options for the dropdown filter */
const RISK_LEVELS: (RiskLevel | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

/* Colors for the transaction type breakdown chart */
const TYPE_COLORS: Record<string, string> = {
  'Wire': '#ef476f', 'ACH': '#ffd166', 'Check': '#06d6a0', 'Card': '#00b4d8',
  'Cash': '#118ab2', 'Internal Transfer': '#9b5de5', 'Foreign Exchange': '#f15bb5',
  'Trade': '#fee440', 'Loan Payment': '#00bbf9', 'Fee': '#8899aa',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    flex: 1,
    overflow: 'auto',
  },
  backBtn: {
    background: 'transparent',
    color: '#00b4d8',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  caseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  caseTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 4,
  },
  caseId: {
    fontSize: 14,
    color: '#00b4d8',
    fontWeight: 600,
  },
  /* Case summary info cards arranged in a row */
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    background: '#1e2d42',
    borderRadius: 8,
    padding: 14,
    border: '1px solid #2a3f5f',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#5a6d82',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#e0e6ed',
    fontWeight: 600,
  },
  notesCard: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 16,
    border: '1px solid #2a3f5f',
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#8899aa',
    lineHeight: 1.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 12,
    marginTop: 8,
  },
  analyticsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 20,
  },
  chartCard: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 16,
    border: '1px solid #2a3f5f',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 12,
  },
  /* Transaction filter controls row */
  txnFilters: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 14,
    border: '1px solid #2a3f5f',
    marginBottom: 12,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 10,
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#5a6d82',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tableCard: {
    background: '#1e2d42',
    borderRadius: 10,
    border: '1px solid #2a3f5f',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto' as const,
  },
  resultCount: {
    fontSize: 12,
    color: '#5a6d82',
    padding: '8px 12px',
    borderBottom: '1px solid #1e3250',
  },
  /* Escalation button styled in amber to signal severity */
  escalateBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  /* Overlay backdrop for the escalation dialog */
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
    width: 480,
    border: '1px solid #2a3f5f',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f59e0b',
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
  modalSelect: {
    width: '100%',
    padding: '10px 14px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 8,
    color: '#e0e8f0',
    fontSize: 14,
    marginBottom: 16,
    boxSizing: 'border-box' as const,
  },
  modalTextarea: {
    width: '100%',
    padding: '10px 14px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 8,
    color: '#e0e8f0',
    fontSize: 14,
    minHeight: 100,
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
  modalSubmit: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  /* Info banner shown to senior analysts with escalation metadata */
  escalationBanner: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  escalationBannerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#f59e0b',
    marginBottom: 8,
  },
  escalationBannerText: {
    fontSize: 13,
    color: '#8899aa',
    lineHeight: 1.6,
  },
};

/* Predefined reasons for escalation dropdown */
const ESCALATION_REASONS = [
  'Suspicious Transaction Pattern',
  'High-Value Fraud Detected',
  'Multiple Account Compromise',
  'Regulatory Compliance Concern',
  'Cross-Border Suspicious Activity',
  'Insider Threat Indicators',
  'Other',
];

export default function CaseDetail({ cases }: CaseDetailProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { escalateCase, getEscalation } = useEscalation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnFilters, setTxnFilters] = useState<TransactionFilters>(DEFAULT_TXN_FILTERS);
  const [txnSort, setTxnSort] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [txnPage, setTxnPage] = useState(1);
  const [loading, setLoading] = useState(true);

  /* Escalation dialog state — only used by analysts */
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState(ESCALATION_REASONS[0]);
  const [escalateNotes, setEscalateNotes] = useState('');

  /* Find the case matching the URL parameter */
  const fraudCase = cases.find(c => c.caseId === caseId);

  /* Generate transactions for this case on mount (runs once per case) */
  useEffect(() => {
    if (fraudCase) {
      setLoading(true);
      /* Use requestAnimationFrame to avoid blocking the UI thread during generation */
      const rafId = requestAnimationFrame(() => {
        const txns = generateTransactionsForCase(fraudCase);
        setTransactions(txns);
        setLoading(false);
      });
      /* Cancel pending rAF if the case changes or component unmounts */
      return () => cancelAnimationFrame(rafId);
    }
  }, [fraudCase]);

  /* Collect unique countries from transaction data for the filter dropdown */
  const countries = useMemo(() => {
    const set = new Set(transactions.map(t => t.country));
    return Array.from(set).sort();
  }, [transactions]);

  /* Apply transaction filters */
  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      if (txnFilters.search) {
        const q = txnFilters.search.toLowerCase();
        if (
          !t.transactionId.toLowerCase().includes(q) &&
          !t.senderName.toLowerCase().includes(q) &&
          !t.receiverName.toLowerCase().includes(q) &&
          !t.referenceNumber.toLowerCase().includes(q)
        ) return false;
      }
      if (txnFilters.type !== 'All' && t.type !== txnFilters.type) return false;
      if (txnFilters.status !== 'All' && t.status !== txnFilters.status) return false;
      if (txnFilters.riskLevel !== 'All' && t.riskLevel !== txnFilters.riskLevel) return false;
      if (txnFilters.amountMin && t.amount < txnFilters.amountMin) return false;
      if (txnFilters.amountMax && t.amount > txnFilters.amountMax) return false;
      if (txnFilters.dateFrom && t.date < txnFilters.dateFrom) return false;
      if (txnFilters.dateTo && t.date > txnFilters.dateTo) return false;
      if (txnFilters.country && t.country !== txnFilters.country) return false;
      return true;
    });
  }, [transactions, txnFilters]);

  /* Sort filtered transactions */
  const sortedTxns = useMemo(() => {
    const sorted = [...filteredTxns];
    sorted.sort((a, b) => {
      const aVal = a[txnSort.key as keyof Transaction];
      const bVal = b[txnSort.key as keyof Transaction];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return txnSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return txnSort.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [filteredTxns, txnSort]);

  /* Paginate the sorted transactions */
  const txnTotalPages = Math.ceil(sortedTxns.length / TXN_PAGE_SIZE);
  const pagedTxns = sortedTxns.slice((txnPage - 1) * TXN_PAGE_SIZE, txnPage * TXN_PAGE_SIZE);

  /* Transaction type breakdown for the analytics chart */
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; amount: number }> = {};
    transactions.forEach(t => {
      if (!counts[t.type]) counts[t.type] = { count: 0, amount: 0 };
      counts[t.type].count++;
      counts[t.type].amount += t.amount;
    });
    return Object.entries(counts)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  /* Transaction status summary for the analytics chart */
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  /* Toggle sort direction or switch column for transactions */
  const handleTxnSort = useCallback((key: string) => {
    setTxnSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const renderSortIndicator = (key: string) => {
    if (txnSort.key !== key) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator active">{txnSort.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  /* Show a "not found" message if the case ID doesn't match */
  if (!fraudCase) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/cases')}>← Back to Cases</button>
        <div style={{ textAlign: 'center', padding: 48, color: '#5a6d82' }}>
          Case not found. The specified case ID does not exist in the system.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navigation back to cases list */}
      <button style={styles.backBtn} onClick={() => navigate('/cases')}>← Back to Cases</button>

      {/* Case header with title, status badges, and escalation button */}
      <div style={styles.caseHeader}>
        <div>
          <div style={styles.caseId}>{fraudCase.caseId}</div>
          <div style={styles.caseTitle}>{fraudCase.caseName}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={getPriorityBadgeClass(fraudCase.priority)}>{fraudCase.priority}</span>
          <span className={getStatusBadgeClass(fraudCase.status)}>{fraudCase.status}</span>
          {/* Only analysts see the escalate button (senior analysts already have the case) */}
          {user?.role === 'analyst' && (
            <button
              style={styles.escalateBtn}
              onClick={() => setShowEscalateModal(true)}
            >
              Escalate Case
            </button>
          )}
        </div>
      </div>

      {/* Escalation info banner shown to senior analysts */}
      {user?.role === 'senior_analyst' && getEscalation(fraudCase.caseId) && (() => {
        const esc = getEscalation(fraudCase.caseId)!;
        return (
          <div style={styles.escalationBanner}>
            <div style={styles.escalationBannerTitle}>Escalated Case</div>
            <div style={styles.escalationBannerText}>
              <strong>Escalated by:</strong> {esc.escalatedByName}<br />
              <strong>Reason:</strong> {esc.reason}<br />
              <strong>Notes:</strong> {esc.notes || 'No additional notes'}<br />
              <strong>Escalated at:</strong> {formatDate(esc.escalatedAt)}
            </div>
          </div>
        );
      })()}

      {/* Escalation confirmation dialog */}
      {showEscalateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEscalateModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Escalate Case: {fraudCase.caseId}</div>

            <label style={styles.modalLabel}>Reason for Escalation</label>
            <select
              style={styles.modalSelect}
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
            >
              {ESCALATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <label style={styles.modalLabel}>Additional Notes</label>
            <textarea
              style={styles.modalTextarea}
              value={escalateNotes}
              onChange={e => setEscalateNotes(e.target.value)}
              placeholder="Provide details about why this case needs escalation..."
            />

            <div style={styles.modalActions}>
              <button style={styles.modalCancel} onClick={() => setShowEscalateModal(false)}>
                Cancel
              </button>
              <button
                style={styles.modalSubmit}
                onClick={() => {
                  /* Submit escalation and redirect analyst back to cases list */
                  escalateCase({
                    caseId: fraudCase.caseId,
                    escalatedBy: user!.username,
                    escalatedByName: user!.displayName,
                    reason: escalateReason,
                    notes: escalateNotes,
                  });
                  setShowEscalateModal(false);
                  navigate('/cases');
                }}
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case information summary cards */}
      <div style={styles.infoGrid}>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Customer</div>
          <div style={styles.infoValue}>{fraudCase.customerName}</div>
          <div style={{ fontSize: 11, color: '#5a6d82', marginTop: 2 }}>
            ID: {fraudCase.customerId} | Acct: {fraudCase.accountNumber}
          </div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Risk Score</div>
          <div style={{ ...styles.infoValue, color: getRiskScoreColor(fraudCase.riskScore), fontSize: 24 }}>
            {fraudCase.riskScore}/100
          </div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Total Amount</div>
          <div style={{ ...styles.infoValue, fontSize: 20 }}>{formatCurrency(fraudCase.totalAmount)}</div>
          <div style={{ fontSize: 11, color: '#5a6d82', marginTop: 2 }}>
            {formatNumber(fraudCase.transactionCount)} transactions
          </div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Investigation</div>
          <div style={styles.infoValue}>{fraudCase.assignedTo}</div>
          <div style={{ fontSize: 11, color: '#5a6d82', marginTop: 2 }}>
            {fraudCase.alertSource} | {fraudCase.region}
          </div>
        </div>
      </div>

      {/* Additional case metadata */}
      <div style={{ ...styles.infoGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Category</div>
          <div style={styles.infoValue}>{fraudCase.category}</div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Created</div>
          <div style={styles.infoValue}>{formatDate(fraudCase.createdDate)}</div>
        </div>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Last Updated</div>
          <div style={styles.infoValue}>{formatDate(fraudCase.lastUpdated)}</div>
        </div>
      </div>

      {/* Case investigation notes */}
      <div style={styles.notesCard}>
        <div style={styles.notesTitle}>Investigation Notes</div>
        <div style={styles.notesText}>{fraudCase.notes}</div>
      </div>

      {/* Transaction analytics charts */}
      {!loading && transactions.length > 0 && (
        <>
          <div style={styles.sectionTitle}>Transaction Analytics</div>
          <div style={styles.analyticsRow}>
            {/* Transaction count by type bar chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Transactions by Type</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeBreakdown} layout="vertical">
                  <XAxis type="number" stroke="#5a6d82" fontSize={11} />
                  <YAxis type="category" dataKey="type" stroke="#5a6d82" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{ background: '#1e2d42', border: '1px solid #2a3f5f', borderRadius: 6, color: '#e0e6ed' }}
                    formatter={(value) => [formatNumber(Number(value)), 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {typeBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={TYPE_COLORS[entry.type] || '#8899aa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transaction status breakdown chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Transactions by Status</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusBreakdown}>
                  <XAxis dataKey="status" stroke="#5a6d82" fontSize={11} />
                  <YAxis stroke="#5a6d82" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#1e2d42', border: '1px solid #2a3f5f', borderRadius: 6, color: '#e0e6ed' }}
                    formatter={(value) => [formatNumber(Number(value)), 'Count']}
                  />
                  <Bar dataKey="count" fill="#00b4d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Transaction list section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={styles.sectionTitle}>
          Transactions {!loading && `(${formatNumber(filteredTxns.length)})`}
        </div>
        {/* Reset transaction filters button */}
        <button
          style={{
            background: 'rgba(239, 71, 111, 0.15)',
            color: '#ff6b8a',
            border: '1px solid rgba(239, 71, 111, 0.3)',
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => { setTxnFilters(DEFAULT_TXN_FILTERS); setTxnPage(1); }}
        >
          Reset Filters
        </button>
      </div>

      {/* Transaction filter controls */}
      <div style={styles.txnFilters}>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Search</label>
          <input
            type="text"
            placeholder="ID, sender, receiver..."
            value={txnFilters.search}
            onChange={e => { setTxnFilters(f => ({ ...f, search: e.target.value })); setTxnPage(1); }}
          />
        </div>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Type</label>
          <select
            value={txnFilters.type}
            onChange={e => { setTxnFilters(f => ({ ...f, type: e.target.value as TransactionType | 'All' })); setTxnPage(1); }}
          >
            {TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Status</label>
          <select
            value={txnFilters.status}
            onChange={e => { setTxnFilters(f => ({ ...f, status: e.target.value as TransactionStatus | 'All' })); setTxnPage(1); }}
          >
            {TXN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Risk Level</label>
          <select
            value={txnFilters.riskLevel}
            onChange={e => { setTxnFilters(f => ({ ...f, riskLevel: e.target.value as RiskLevel | 'All' })); setTxnPage(1); }}
          >
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Country</label>
          <select
            value={txnFilters.country}
            onChange={e => { setTxnFilters(f => ({ ...f, country: e.target.value })); setTxnPage(1); }}
          >
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Amount Min</label>
          <input
            type="number"
            placeholder="Min"
            value={txnFilters.amountMin || ''}
            onChange={e => { setTxnFilters(f => ({ ...f, amountMin: Number(e.target.value) || 0 })); setTxnPage(1); }}
          />
        </div>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Amount Max</label>
          <input
            type="number"
            placeholder="Max"
            value={txnFilters.amountMax || ''}
            onChange={e => { setTxnFilters(f => ({ ...f, amountMax: Number(e.target.value) || 0 })); setTxnPage(1); }}
          />
        </div>
        <div style={styles.filterField}>
          <label style={styles.filterLabel}>Date From</label>
          <input
            type="date"
            value={txnFilters.dateFrom}
            onChange={e => { setTxnFilters(f => ({ ...f, dateFrom: e.target.value })); setTxnPage(1); }}
          />
        </div>
      </div>

      {/* Loading indicator while transactions are generated */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#5a6d82' }}>
          Generating transaction data...
        </div>
      ) : (
        /* Transaction data table */
        <div style={styles.tableCard}>
          <div style={styles.resultCount}>
            Showing {formatNumber(sortedTxns.length)} of {formatNumber(transactions.length)} transactions
          </div>
          <div style={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleTxnSort('transactionId')}>ID {renderSortIndicator('transactionId')}</th>
                  <th onClick={() => handleTxnSort('type')}>Type {renderSortIndicator('type')}</th>
                  <th onClick={() => handleTxnSort('amount')}>Amount {renderSortIndicator('amount')}</th>
                  <th onClick={() => handleTxnSort('currency')}>Ccy {renderSortIndicator('currency')}</th>
                  <th onClick={() => handleTxnSort('date')}>Date {renderSortIndicator('date')}</th>
                  <th onClick={() => handleTxnSort('senderName')}>Sender {renderSortIndicator('senderName')}</th>
                  <th onClick={() => handleTxnSort('receiverName')}>Receiver {renderSortIndicator('receiverName')}</th>
                  <th onClick={() => handleTxnSort('status')}>Status {renderSortIndicator('status')}</th>
                  <th onClick={() => handleTxnSort('riskLevel')}>Risk {renderSortIndicator('riskLevel')}</th>
                  <th onClick={() => handleTxnSort('country')}>Country {renderSortIndicator('country')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedTxns.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: '#5a6d82' }}>
                      No transactions match your filters.
                    </td>
                  </tr>
                ) : (
                  pagedTxns.map(t => (
                    <tr key={t.transactionId}>
                      <td style={{ color: '#00b4d8', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {t.transactionId}
                      </td>
                      <td>{t.type}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                      <td style={{ color: '#8899aa' }}>{t.currency}</td>
                      <td style={{ color: '#8899aa' }}>{formatDate(t.date)}</td>
                      <td>
                        <div>{t.senderName}</div>
                        <div style={{ fontSize: 11, color: '#5a6d82' }}>{t.senderBank}</div>
                      </td>
                      <td>
                        <div>{t.receiverName}</div>
                        <div style={{ fontSize: 11, color: '#5a6d82' }}>{t.receiverBank}</div>
                      </td>
                      <td>
                        <span className={getTransactionStatusBadgeClass(t.status)}>{t.status}</span>
                      </td>
                      <td>
                        <span className={getPriorityBadgeClass(t.riskLevel)}>{t.riskLevel}</span>
                      </td>
                      <td style={{ color: '#8899aa' }}>{t.country}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Transaction pagination controls */}
          {txnTotalPages > 1 && (
            <div className="pagination">
              <button disabled={txnPage === 1} onClick={() => setTxnPage(1)}>«</button>
              <button disabled={txnPage === 1} onClick={() => setTxnPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(txnTotalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (txnTotalPages <= 7) {
                  pageNum = i + 1;
                } else if (txnPage <= 4) {
                  pageNum = i + 1;
                } else if (txnPage >= txnTotalPages - 3) {
                  pageNum = txnTotalPages - 6 + i;
                } else {
                  pageNum = txnPage - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={txnPage === pageNum ? 'active' : ''}
                    onClick={() => setTxnPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button disabled={txnPage === txnTotalPages} onClick={() => setTxnPage(p => p + 1)}>›</button>
              <button disabled={txnPage === txnTotalPages} onClick={() => setTxnPage(txnTotalPages)}>»</button>
              <span style={{ fontSize: 12, color: '#5a6d82', marginLeft: 8 }}>
                Page {txnPage} of {txnTotalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
