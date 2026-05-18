/**
 * Sample data generator for the NICE Actimize Fraud Investigation application.
 * Generates ~100 fraud cases with ~1000 transactions each using deterministic
 * seeded random for reproducibility. All data is fictional and for demo purposes only.
 */

import type {
  FraudCase,
  Transaction,
  CaseStatus,
  CasePriority,
  FraudCategory,
  TransactionType,
  TransactionStatus,
  RiskLevel,
} from '../types';

/* Simple seeded pseudo-random number generator for reproducible data */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /* Returns a pseudo-random number between 0 and 1 */
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }

  /* Returns a random integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /* Picks a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  /* Returns a random float in [min, max] rounded to 2 decimals */
  nextFloat(min: number, max: number): number {
    return Math.round((this.next() * (max - min) + min) * 100) / 100;
  }
}

/* Reference data arrays used to generate realistic-looking records */

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Ahmed', 'Fatima', 'Wei', 'Yuki', 'Carlos', 'Maria', 'Ivan', 'Olga',
  'Raj', 'Priya', 'Hans', 'Ingrid', 'Pierre', 'Sophie', 'Marco', 'Giulia',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Chen', 'Tanaka', 'Kumar', 'Müller', 'Dubois', 'Rossi', 'Petrov', 'Kim',
];

const BANKS = [
  'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Goldman Sachs',
  'Morgan Stanley', 'HSBC', 'Deutsche Bank', 'Barclays', 'BNP Paribas',
  'UBS', 'Credit Suisse', 'Royal Bank of Canada', 'Santander', 'ING Group',
  'Société Générale', 'Standard Chartered', 'Mizuho Financial', 'MUFG Bank', 'ANZ Banking',
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Canada',
  'Japan', 'Australia', 'Switzerland', 'Singapore', 'Hong Kong',
  'Brazil', 'India', 'China', 'Russia', 'Mexico',
  'Nigeria', 'Cayman Islands', 'Panama', 'UAE', 'South Korea',
];

const REGIONS = [
  'North America', 'Europe', 'Asia Pacific', 'Latin America',
  'Middle East', 'Africa', 'Caribbean',
];

const ALERT_SOURCES = [
  'SAR Filing', 'Automated Rule Engine', 'Manual Review', 'Customer Complaint',
  'Law Enforcement Referral', 'Internal Audit', 'Behavioral Analytics',
  'Peer Bank Notification', 'Regulatory Inquiry', 'Transaction Monitoring',
];

const INVESTIGATORS = [
  'Sarah Mitchell', 'James Rodriguez', 'Emily Chen', 'Michael O\'Brien',
  'Priya Sharma', 'David Kim', 'Lisa Thompson', 'Robert Garcia',
  'Anna Petrov', 'Carlos Mendez', 'Jennifer Liu', 'William Taylor',
  'Rachel Adams', 'Hassan Ali', 'Maria Santos', 'Daniel Park',
];

const CASE_STATUSES: CaseStatus[] = [
  'Open', 'Under Investigation', 'Escalated', 'Closed - Confirmed Fraud', 'Closed - False Positive',
];

const CASE_PRIORITIES: CasePriority[] = ['Critical', 'High', 'Medium', 'Low'];

const FRAUD_CATEGORIES: FraudCategory[] = [
  'Wire Fraud', 'Identity Theft', 'Account Takeover', 'Money Laundering',
  'Check Fraud', 'Card Fraud', 'ACH Fraud', 'Internal Fraud',
  'Trade-Based Laundering', 'Structuring',
];

const TRANSACTION_TYPES: TransactionType[] = [
  'Wire', 'ACH', 'Check', 'Card', 'Cash', 'Internal Transfer',
  'Foreign Exchange', 'Trade', 'Loan Payment', 'Fee',
];

const TRANSACTION_STATUSES: TransactionStatus[] = [
  'Completed', 'Pending', 'Failed', 'Reversed', 'Blocked',
];

const RISK_LEVELS: RiskLevel[] = ['Critical', 'High', 'Medium', 'Low'];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'HKD', 'BRL'];

const CASE_NOTES = [
  'Multiple suspicious wire transfers detected to high-risk jurisdictions.',
  'Customer account shows unusual transaction patterns inconsistent with profile.',
  'Identity documents appear to be fraudulent based on verification checks.',
  'Rapid succession of transactions just below reporting threshold detected.',
  'Account opened recently with immediate high-value international transfers.',
  'Customer flagged by peer bank for suspicious activity on shared accounts.',
  'Internal employee bypassed dual-authorization controls for fund transfers.',
  'Trade invoices show significant overvaluation compared to market prices.',
  'Multiple cash deposits across branches in structured amounts detected.',
  'Account takeover suspected: login from multiple geographies within hours.',
  'Customer refuses to provide source of funds documentation.',
  'Transactions match known money laundering typologies for layering.',
  'Unusually high volume of ACH returns and reversals on this account.',
  'Card present transactions in multiple countries within same day.',
  'Check kiting pattern identified across linked accounts.',
];

/* Generates a formatted date string within a date range */
function generateDate(rng: SeededRandom, startYear: number, endYear: number): string {
  const year = rng.nextInt(startYear, endYear);
  const month = rng.nextInt(1, 12);
  const day = rng.nextInt(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/* Generates a random account number string */
function generateAccountNumber(rng: SeededRandom): string {
  let acct = '';
  for (let i = 0; i < 10; i++) {
    acct += rng.nextInt(0, 9).toString();
  }
  return acct;
}

/* Generates a random reference number for transactions */
function generateRefNumber(rng: SeededRandom): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 12; i++) {
    ref += chars[rng.nextInt(0, chars.length - 1)];
  }
  return ref;
}

/* Transaction description templates for realistic detail text */
const TXN_DESCRIPTIONS: Record<TransactionType, string[]> = {
  'Wire': [
    'International wire transfer', 'Domestic wire payment', 'Urgent wire transfer',
    'Wire transfer to correspondent bank', 'Same-day wire settlement',
  ],
  'ACH': [
    'ACH direct deposit', 'ACH bill payment', 'ACH credit transfer',
    'Payroll ACH batch', 'ACH recurring payment',
  ],
  'Check': [
    'Personal check deposit', 'Cashier check', 'Third-party check deposit',
    'Business check clearing', 'Remote deposit capture',
  ],
  'Card': [
    'Point of sale purchase', 'Online card transaction', 'ATM withdrawal',
    'Card-not-present transaction', 'Contactless payment',
  ],
  'Cash': [
    'Cash deposit at branch', 'Cash withdrawal', 'Currency exchange',
    'Cash deposit via ATM', 'Vault cash transaction',
  ],
  'Internal Transfer': [
    'Account-to-account transfer', 'Savings to checking', 'Investment transfer',
    'Inter-branch transfer', 'Sweep account transfer',
  ],
  'Foreign Exchange': [
    'Spot FX transaction', 'FX forward contract', 'Currency conversion',
    'Cross-border FX settlement', 'FX swap transaction',
  ],
  'Trade': [
    'Securities purchase', 'Bond trade settlement', 'Equity trade',
    'Commodity trade', 'Derivative settlement',
  ],
  'Loan Payment': [
    'Monthly loan installment', 'Loan principal payment', 'Interest payment',
    'Loan payoff', 'Line of credit draw',
  ],
  'Fee': [
    'Service charge', 'Wire transfer fee', 'Overdraft fee',
    'Account maintenance fee', 'Foreign transaction fee',
  ],
};

/**
 * Generates 100 sample fraud cases. Each case has a unique ID, realistic
 * attributes, and a computed transaction count that will be used when
 * generating per-case transactions.
 */
export function generateCases(): FraudCase[] {
  const rng = new SeededRandom(42);
  const cases: FraudCase[] = [];

  for (let i = 0; i < 100; i++) {
    const firstName = rng.pick(FIRST_NAMES);
    const lastName = rng.pick(LAST_NAMES);
    const category = rng.pick(FRAUD_CATEGORIES);
    const priority = rng.pick(CASE_PRIORITIES);
    const status = rng.pick(CASE_STATUSES);

    /* Risk score is weighted higher for critical/high priority cases */
    let riskScore: number;
    if (priority === 'Critical') {
      riskScore = rng.nextInt(80, 100);
    } else if (priority === 'High') {
      riskScore = rng.nextInt(60, 85);
    } else if (priority === 'Medium') {
      riskScore = rng.nextInt(35, 65);
    } else {
      riskScore = rng.nextInt(10, 40);
    }

    /* Transaction count varies between 800-1200 per case to average ~1000 */
    const txnCount = rng.nextInt(800, 1200);
    const totalAmount = rng.nextFloat(10000, 5000000);

    cases.push({
      caseId: `CASE-${String(i + 1).padStart(4, '0')}`,
      caseName: `${category} - ${firstName} ${lastName}`,
      status,
      priority,
      riskScore,
      assignedTo: rng.pick(INVESTIGATORS),
      createdDate: generateDate(rng, 2024, 2025),
      lastUpdated: generateDate(rng, 2025, 2026),
      category,
      totalAmount,
      transactionCount: txnCount,
      customerName: `${firstName} ${lastName}`,
      customerId: `CUST-${rng.nextInt(100000, 999999)}`,
      accountNumber: generateAccountNumber(rng),
      alertSource: rng.pick(ALERT_SOURCES),
      region: rng.pick(REGIONS),
      notes: rng.pick(CASE_NOTES),
    });
  }

  return cases;
}

/**
 * Generates transactions for a specific case. Creates the exact number
 * specified by the case's transactionCount field (typically ~1000).
 * Transactions are seeded deterministically per case for consistency.
 */
export function generateTransactionsForCase(fraudCase: FraudCase): Transaction[] {
  /* Seed based on case index so data is reproducible */
  const caseIndex = parseInt(fraudCase.caseId.replace('CASE-', ''), 10);
  const rng = new SeededRandom(caseIndex * 1000 + 7);
  const transactions: Transaction[] = [];

  for (let j = 0; j < fraudCase.transactionCount; j++) {
    const type = rng.pick(TRANSACTION_TYPES);
    const status = rng.pick(TRANSACTION_STATUSES);

    /* Amount varies by transaction type for realism */
    let amount: number;
    if (type === 'Wire' || type === 'Trade') {
      amount = rng.nextFloat(1000, 500000);
    } else if (type === 'Foreign Exchange') {
      amount = rng.nextFloat(5000, 1000000);
    } else if (type === 'Fee') {
      amount = rng.nextFloat(5, 500);
    } else {
      amount = rng.nextFloat(50, 50000);
    }

    const senderFirst = rng.pick(FIRST_NAMES);
    const senderLast = rng.pick(LAST_NAMES);
    const receiverFirst = rng.pick(FIRST_NAMES);
    const receiverLast = rng.pick(LAST_NAMES);

    transactions.push({
      transactionId: `TXN-${fraudCase.caseId}-${String(j + 1).padStart(5, '0')}`,
      caseId: fraudCase.caseId,
      type,
      amount,
      currency: rng.pick(CURRENCIES),
      date: generateDate(rng, 2024, 2026),
      senderName: `${senderFirst} ${senderLast}`,
      senderAccount: generateAccountNumber(rng),
      senderBank: rng.pick(BANKS),
      receiverName: `${receiverFirst} ${receiverLast}`,
      receiverAccount: generateAccountNumber(rng),
      receiverBank: rng.pick(BANKS),
      status,
      riskLevel: rng.pick(RISK_LEVELS),
      country: rng.pick(COUNTRIES),
      description: rng.pick(TXN_DESCRIPTIONS[type]),
      referenceNumber: generateRefNumber(rng),
    });
  }

  return transactions;
}
