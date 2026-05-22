/**
 * Core type definitions for the NICE Actimize Fraud Investigation application.
 * Defines the data structures for fraud cases, transactions, and filter criteria.
 */

/* Possible statuses for a fraud investigation case */
export type CaseStatus = 'Open' | 'Under Investigation' | 'Escalated' | 'Closed - Confirmed Fraud' | 'Closed - False Positive';

/* Priority levels for fraud cases */
export type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low';

/* Categories of fraud detected */
export type FraudCategory =
  | 'Wire Fraud'
  | 'Identity Theft'
  | 'Account Takeover'
  | 'Money Laundering'
  | 'Check Fraud'
  | 'Card Fraud'
  | 'ACH Fraud'
  | 'Internal Fraud'
  | 'Trade-Based Laundering'
  | 'Structuring';

/* Transaction types supported in the system */
export type TransactionType = 'Wire' | 'ACH' | 'Check' | 'Card' | 'Cash' | 'Internal Transfer' | 'Foreign Exchange' | 'Trade' | 'Loan Payment' | 'Fee';

/* Transaction status values */
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Reversed' | 'Blocked';

/* Risk level classification for transactions */
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

/* Represents a single fraud investigation case */
export interface FraudCase {
  caseId: string;
  caseName: string;
  status: CaseStatus;
  priority: CasePriority;
  riskScore: number; // 0-100 risk score
  assignedTo: string;
  createdDate: string;
  lastUpdated: string;
  category: FraudCategory;
  totalAmount: number;
  transactionCount: number;
  customerName: string;
  customerId: string;
  accountNumber: string;
  alertSource: string; // SAR, automated rule, manual, etc.
  region: string;
  notes: string;
}

/* Represents a single financial transaction linked to a fraud case */
export interface Transaction {
  transactionId: string;
  caseId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  senderName: string;
  senderAccount: string;
  senderBank: string;
  receiverName: string;
  receiverAccount: string;
  receiverBank: string;
  status: TransactionStatus;
  riskLevel: RiskLevel;
  country: string;
  description: string;
  referenceNumber: string;
}

/* Filter criteria for the cases list view */
export interface CaseFilters {
  search: string;
  status: CaseStatus | 'All';
  priority: CasePriority | 'All';
  category: FraudCategory | 'All';
  region: string;
  riskScoreMin: number;
  riskScoreMax: number;
  dateFrom: string;
  dateTo: string;
  amountMin: number;
  amountMax: number;
}

/* Filter criteria for the transaction detail view */
export interface TransactionFilters {
  search: string;
  type: TransactionType | 'All';
  status: TransactionStatus | 'All';
  riskLevel: RiskLevel | 'All';
  amountMin: number;
  amountMax: number;
  dateFrom: string;
  dateTo: string;
  country: string;
}

/* Summary statistics displayed on the dashboard */
export interface DashboardStats {
  totalCases: number;
  openCases: number;
  escalatedCases: number;
  confirmedFraud: number;
  totalAmount: number;
  avgRiskScore: number;
  criticalCases: number;
  casesThisMonth: number;
}

/* Sort configuration for table columns */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/* User roles for role-based access control */
export type UserRole = 'analyst' | 'senior_analyst' | 'sar_analyst' | 'sar_supervisor';

/* Represents an authenticated user in the system */
export interface User {
  username: string;
  displayName: string;
  role: UserRole;
  initials: string;
}

/* SAR filing status lifecycle */
export type SarStatus = 'Draft' | 'Pending Review' | 'Revision Requested' | 'Approved' | 'Filed';

/* Suspicious activity type categories per FinCEN guidelines */
export type SuspiciousActivityType =
  | 'Structuring'
  | 'Terrorist Financing'
  | 'Fraud — Wire'
  | 'Fraud — Check'
  | 'Fraud — ACH'
  | 'Fraud — Card'
  | 'Money Laundering'
  | 'Identity Theft'
  | 'Insider Abuse'
  | 'Bribery / Corruption'
  | 'Other';

/* Represents a Suspicious Activity Report (SAR) linked to an escalated case */
export interface SarReport {
  sarId: string;
  caseId: string;
  status: SarStatus;
  /* Subject (suspect) information */
  subjectName: string;
  subjectIdType: string;
  subjectIdNumber: string;
  subjectAddress: string;
  subjectDob: string;
  /* Suspicious activity details */
  activityType: SuspiciousActivityType;
  activityStartDate: string;
  activityEndDate: string;
  totalAmountInvolved: number;
  /* Narrative and filing metadata */
  narrative: string;
  filingDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  lastUpdatedAt: string;
  /* Review workflow fields */
  reviewedBy: string;
  reviewedByName: string;
  reviewNotes: string;
  referredBy: string;
  referredByName: string;
}
