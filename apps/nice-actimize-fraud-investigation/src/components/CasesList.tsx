/**
 * Cases list page with sortable table, pagination, and filtering.
 * Shows all 100 fraud cases with the ability to drill into case details.
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FraudCase, CaseFilters, SortConfig } from '../types';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  getRiskScoreColor,
} from '../utils/helpers';
import CaseFiltersPanel from './CaseFiltersPanel';

interface CasesListProps {
  cases: FraudCase[];
}

/* Default filter state with no filters applied */
const DEFAULT_FILTERS: CaseFilters = {
  search: '',
  status: 'All',
  priority: 'All',
  category: 'All',
  region: '',
  riskScoreMin: 0,
  riskScoreMax: 100,
  dateFrom: '',
  dateTo: '',
  amountMin: 0,
  amountMax: 0,
};

const PAGE_SIZE = 20;

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    flex: 1,
    overflow: 'auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e0e6ed',
  },
  resultCount: {
    fontSize: 13,
    color: '#8899aa',
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
  /* Risk score visual bar displayed inside the table cell */
  riskBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    background: '#1b2838',
  },
  riskFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: 48,
    color: '#5a6d82',
    fontSize: 16,
  },
};

export default function CasesList({ cases }: CasesListProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CaseFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortConfig>({ key: 'riskScore', direction: 'desc' });
  const [page, setPage] = useState(1);

  /* Collect unique regions from the dataset for the filter dropdown */
  const regions = useMemo(() => {
    const set = new Set(cases.map(c => c.region));
    return Array.from(set).sort();
  }, [cases]);

  /* Apply all active filters to produce the filtered case list */
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      /* Text search across case ID, name, and customer name */
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !c.caseId.toLowerCase().includes(q) &&
          !c.caseName.toLowerCase().includes(q) &&
          !c.customerName.toLowerCase().includes(q)
        ) return false;
      }
      if (filters.status !== 'All' && c.status !== filters.status) return false;
      if (filters.priority !== 'All' && c.priority !== filters.priority) return false;
      if (filters.category !== 'All' && c.category !== filters.category) return false;
      if (filters.region && c.region !== filters.region) return false;
      if (c.riskScore < filters.riskScoreMin || c.riskScore > filters.riskScoreMax) return false;
      if (filters.dateFrom && c.createdDate < filters.dateFrom) return false;
      if (filters.dateTo && c.createdDate > filters.dateTo) return false;
      if (filters.amountMin && c.totalAmount < filters.amountMin) return false;
      if (filters.amountMax && c.totalAmount > filters.amountMax) return false;
      return true;
    });
  }, [cases, filters]);

  /* Sort the filtered results by the currently selected column */
  const sortedCases = useMemo(() => {
    const sorted = [...filteredCases];
    sorted.sort((a, b) => {
      const aVal = a[sort.key as keyof FraudCase];
      const bVal = b[sort.key as keyof FraudCase];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sort.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [filteredCases, sort]);

  /* Paginate the sorted results */
  const totalPages = Math.ceil(sortedCases.length / PAGE_SIZE);
  const pagedCases = sortedCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Toggle sort direction or change sort column */
  const handleSort = useCallback((key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  /* Render sort indicator arrow next to the active column header */
  const renderSortIndicator = (key: string) => {
    if (sort.key !== key) return <span className="sort-indicator">↕</span>;
    return (
      <span className="sort-indicator active">
        {sort.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  /* Reset page to 1 when filters change */
  const handleFilterChange = (newFilters: CaseFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.pageTitle}>Fraud Cases</div>
          <div style={styles.resultCount}>
            Showing {formatNumber(sortedCases.length)} of {formatNumber(cases.length)} cases
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <CaseFiltersPanel
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); }}
        regions={regions}
      />

      {/* Results table */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('caseId')}>
                  Case ID {renderSortIndicator('caseId')}
                </th>
                <th onClick={() => handleSort('category')}>
                  Category {renderSortIndicator('category')}
                </th>
                <th onClick={() => handleSort('customerName')}>
                  Customer {renderSortIndicator('customerName')}
                </th>
                <th onClick={() => handleSort('priority')}>
                  Priority {renderSortIndicator('priority')}
                </th>
                <th onClick={() => handleSort('status')}>
                  Status {renderSortIndicator('status')}
                </th>
                <th onClick={() => handleSort('riskScore')}>
                  Risk {renderSortIndicator('riskScore')}
                </th>
                <th onClick={() => handleSort('totalAmount')}>
                  Amount {renderSortIndicator('totalAmount')}
                </th>
                <th onClick={() => handleSort('transactionCount')}>
                  Txns {renderSortIndicator('transactionCount')}
                </th>
                <th onClick={() => handleSort('region')}>
                  Region {renderSortIndicator('region')}
                </th>
                <th onClick={() => handleSort('assignedTo')}>
                  Assigned {renderSortIndicator('assignedTo')}
                </th>
                <th onClick={() => handleSort('createdDate')}>
                  Created {renderSortIndicator('createdDate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedCases.length === 0 ? (
                <tr>
                  <td colSpan={11} style={styles.noResults}>
                    No cases match your filters. Try adjusting the criteria.
                  </td>
                </tr>
              ) : (
                pagedCases.map(c => (
                  <tr
                    key={c.caseId}
                    className="clickable"
                    onClick={() => navigate(`/cases/${c.caseId}`)}
                  >
                    <td style={{ color: '#00b4d8', fontWeight: 600 }}>{c.caseId}</td>
                    <td>{c.category}</td>
                    <td>{c.customerName}</td>
                    <td>
                      <span className={getPriorityBadgeClass(c.priority)}>{c.priority}</span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(c.status)}>{c.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: getRiskScoreColor(c.riskScore), fontWeight: 700, minWidth: 24 }}>
                          {c.riskScore}
                        </span>
                        {/* Visual risk score bar */}
                        <div style={{ ...styles.riskBar, width: 60 }}>
                          <div style={{
                            ...styles.riskFill,
                            width: `${c.riskScore}%`,
                            background: getRiskScoreColor(c.riskScore),
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>{formatCurrency(c.totalAmount)}</td>
                    <td style={{ color: '#8899aa' }}>{formatNumber(c.transactionCount)}</td>
                    <td style={{ color: '#8899aa' }}>{c.region}</td>
                    <td style={{ color: '#8899aa' }}>{c.assignedTo}</td>
                    <td style={{ color: '#8899aa' }}>{formatDate(c.createdDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              /* Show pages around the current page for large page counts */
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={page === pageNum ? 'active' : ''}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}
