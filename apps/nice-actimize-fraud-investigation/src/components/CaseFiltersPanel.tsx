/**
 * Filter panel for the Cases list view. Provides controls to filter
 * fraud cases by search text, status, priority, category, region,
 * risk score range, date range, and amount range.
 */

import type { CaseFilters, CaseStatus, CasePriority, FraudCategory } from '../types';

interface CaseFiltersPanelProps {
  filters: CaseFilters;
  onChange: (filters: CaseFilters) => void;
  onReset: () => void;
  regions: string[];
}

/* All available case statuses for the dropdown */
const STATUSES: (CaseStatus | 'All')[] = [
  'All', 'Open', 'Under Investigation', 'Escalated',
  'Closed - Confirmed Fraud', 'Closed - False Positive',
];

/* All available priority levels for the dropdown */
const PRIORITIES: (CasePriority | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

/* All available fraud categories for the dropdown */
const CATEGORIES: (FraudCategory | 'All')[] = [
  'All', 'Wire Fraud', 'Identity Theft', 'Account Takeover', 'Money Laundering',
  'Check Fraud', 'Card Fraud', 'ACH Fraud', 'Internal Fraud',
  'Trade-Based Laundering', 'Structuring',
];

/* Inline styles for the filter panel layout */
const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    border: '1px solid #2a3f5f',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e0e6ed',
  },
  resetBtn: {
    background: 'rgba(239, 71, 111, 0.15)',
    color: '#ff6b8a',
    border: '1px solid rgba(239, 71, 111, 0.3)',
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  /* Grid layout for the filter fields */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8899aa',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  rangeRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  rangeSep: {
    color: '#5a6d82',
    fontSize: 12,
  },
};

export default function CaseFiltersPanel({ filters, onChange, onReset, regions }: CaseFiltersPanelProps) {
  /* Helper to update a single filter field while preserving the rest */
  const updateFilter = <K extends keyof CaseFilters>(key: K, value: CaseFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.title}>Filter Cases</div>
        <button style={styles.resetBtn} onClick={onReset}>Reset Filters</button>
      </div>

      <div style={styles.grid}>
        {/* Free-text search across case ID, name, and customer */}
        <div style={styles.field}>
          <label style={styles.label}>Search</label>
          <input
            type="text"
            placeholder="Case ID, name, customer..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
          />
        </div>

        {/* Status dropdown filter */}
        <div style={styles.field}>
          <label style={styles.label}>Status</label>
          <select
            value={filters.status}
            onChange={e => updateFilter('status', e.target.value as CaseStatus | 'All')}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Priority dropdown filter */}
        <div style={styles.field}>
          <label style={styles.label}>Priority</label>
          <select
            value={filters.priority}
            onChange={e => updateFilter('priority', e.target.value as CasePriority | 'All')}
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Fraud category dropdown filter */}
        <div style={styles.field}>
          <label style={styles.label}>Category</label>
          <select
            value={filters.category}
            onChange={e => updateFilter('category', e.target.value as FraudCategory | 'All')}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Region dropdown populated from available case data */}
        <div style={styles.field}>
          <label style={styles.label}>Region</label>
          <select
            value={filters.region}
            onChange={e => updateFilter('region', e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Risk score range filter (min-max) */}
        <div style={styles.field}>
          <label style={styles.label}>Risk Score Range</label>
          <div style={styles.rangeRow}>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Min"
              value={filters.riskScoreMin || ''}
              onChange={e => updateFilter('riskScoreMin', Number(e.target.value) || 0)}
              style={{ width: '100%' }}
            />
            <span style={styles.rangeSep}>–</span>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Max"
              value={filters.riskScoreMax === 100 ? '' : filters.riskScoreMax}
              onChange={e => updateFilter('riskScoreMax', Number(e.target.value) || 100)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Created date range filter */}
        <div style={styles.field}>
          <label style={styles.label}>Created Date Range</label>
          <div style={styles.rangeRow}>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => updateFilter('dateFrom', e.target.value)}
              style={{ width: '100%' }}
            />
            <span style={styles.rangeSep}>–</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => updateFilter('dateTo', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Total amount range filter */}
        <div style={styles.field}>
          <label style={styles.label}>Amount Range ($)</label>
          <div style={styles.rangeRow}>
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={filters.amountMin || ''}
              onChange={e => updateFilter('amountMin', Number(e.target.value) || 0)}
              style={{ width: '100%' }}
            />
            <span style={styles.rangeSep}>–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={filters.amountMax === 0 ? '' : filters.amountMax}
              onChange={e => updateFilter('amountMax', Number(e.target.value) || 0)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
