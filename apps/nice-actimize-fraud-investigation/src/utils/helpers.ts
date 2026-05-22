/**
 * Utility helpers for formatting currency, dates, risk scores, and
 * deriving CSS class names from status/priority values.
 */

import type { CaseStatus, CasePriority, TransactionStatus, RiskLevel } from '../types';

/* Formats a number as USD currency string */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* Formats a number with commas for readability */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/* Formats an ISO date string to a locale-friendly display format */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* Returns a CSS badge class based on the case status */
export function getStatusBadgeClass(status: CaseStatus): string {
  switch (status) {
    case 'Open':
      return 'badge badge-open';
    case 'Under Investigation':
      return 'badge badge-investigating';
    case 'Escalated':
      return 'badge badge-escalated';
    case 'Closed - Confirmed Fraud':
      return 'badge badge-confirmed';
    case 'Closed - False Positive':
      return 'badge badge-false-positive';
    default:
      return 'badge';
  }
}

/* Returns a CSS badge class based on the priority level */
export function getPriorityBadgeClass(priority: CasePriority | RiskLevel): string {
  switch (priority) {
    case 'Critical':
      return 'badge badge-critical';
    case 'High':
      return 'badge badge-high';
    case 'Medium':
      return 'badge badge-medium';
    case 'Low':
      return 'badge badge-low';
    default:
      return 'badge';
  }
}

/* Returns a CSS badge class based on the transaction status */
export function getTransactionStatusBadgeClass(status: TransactionStatus): string {
  switch (status) {
    case 'Completed':
      return 'badge badge-completed';
    case 'Pending':
      return 'badge badge-pending';
    case 'Failed':
      return 'badge badge-failed';
    case 'Reversed':
      return 'badge badge-reversed';
    case 'Blocked':
      return 'badge badge-blocked';
    default:
      return 'badge';
  }
}

/* Returns a color hex value for risk score visualization */
export function getRiskScoreColor(score: number): string {
  if (score >= 80) return '#ef476f';
  if (score >= 60) return '#ffd166';
  if (score >= 35) return '#00b4d8';
  return '#06d6a0';
}

/* Truncates a string to maxLen characters, appending ellipsis if truncated */
export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}
