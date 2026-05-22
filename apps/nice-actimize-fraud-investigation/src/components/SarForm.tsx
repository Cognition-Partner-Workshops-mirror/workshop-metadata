/**
 * SAR creation and editing form for SAR Analysts.
 * Allows filling out FinCEN-style SAR fields including subject info,
 * suspicious activity details, and a narrative summary.
 * SAR Analysts can save as draft or submit for supervisor review.
 */

import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { FraudCase, SuspiciousActivityType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSar } from '../context/SarContext';
import { useEscalation } from '../context/EscalationContext';
import { formatCurrency } from '../utils/helpers';

interface SarFormProps {
  cases: FraudCase[];
}

/* Suspicious activity type options for dropdown */
const ACTIVITY_TYPES: SuspiciousActivityType[] = [
  'Structuring', 'Terrorist Financing', 'Fraud — Wire', 'Fraud — Check',
  'Fraud — ACH', 'Fraud — Card', 'Money Laundering', 'Identity Theft',
  'Insider Abuse', 'Bribery / Corruption', 'Other',
];

/* Subject ID type options */
const ID_TYPES = ['SSN', 'Passport', 'Driver License', 'EIN', 'ITIN', 'Other'];

/* Inline styles for the SAR form */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    maxWidth: 900,
    margin: '0 auto',
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
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6d82',
    marginBottom: 24,
  },
  /* Case reference banner at top of form */
  caseBanner: {
    background: 'rgba(0, 180, 216, 0.08)',
    border: '1px solid rgba(0, 180, 216, 0.2)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  caseBannerItem: {
    fontSize: 12,
    color: '#8899aa',
  },
  caseBannerValue: {
    fontSize: 14,
    color: '#e0e8f0',
    fontWeight: 600,
  },
  section: {
    background: '#1e2d42',
    borderRadius: 10,
    padding: 20,
    border: '1px solid #2a3f5f',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e0e6ed',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '1px solid #2a3f5f',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#5a6d82',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  input: {
    padding: '8px 12px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 6,
    color: '#e0e8f0',
    fontSize: 13,
    boxSizing: 'border-box' as const,
  },
  select: {
    padding: '8px 12px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 6,
    color: '#e0e8f0',
    fontSize: 13,
    boxSizing: 'border-box' as const,
  },
  textareaField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    gridColumn: '1 / -1',
  },
  textarea: {
    padding: '10px 12px',
    background: '#0a1628',
    border: '1px solid #1e3250',
    borderRadius: 6,
    color: '#e0e8f0',
    fontSize: 13,
    minHeight: 140,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 1.6,
    boxSizing: 'border-box' as const,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  draftBtn: {
    padding: '10px 24px',
    background: 'rgba(0, 180, 216, 0.12)',
    color: '#00b4d8',
    border: '1px solid rgba(0, 180, 216, 0.3)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #06d6a0, #059669)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  /* Revision notes banner shown when supervisor has requested changes */
  revisionBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  revisionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#ef4444',
    marginBottom: 6,
  },
  revisionText: {
    fontSize: 13,
    color: '#8899aa',
    lineHeight: 1.6,
  },
};

export default function SarForm({ cases }: SarFormProps) {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSarForCase, createSar, updateSar, submitForReview, nextSarId, getReferral } = useSar();
  const { getEscalation } = useEscalation();

  const fraudCase = cases.find(c => c.caseId === caseId);
  const existingSar = caseId ? getSarForCase(caseId) : undefined;
  const escalation = caseId ? getEscalation(caseId) : undefined;
  const referral = caseId ? getReferral(caseId) : undefined;

  /* Pre-populate form with existing SAR data or case defaults */
  const [subjectName, setSubjectName] = useState(existingSar?.subjectName ?? fraudCase?.customerName ?? '');
  const [subjectIdType, setSubjectIdType] = useState(existingSar?.subjectIdType ?? 'SSN');
  const [subjectIdNumber, setSubjectIdNumber] = useState(existingSar?.subjectIdNumber ?? '');
  const [subjectAddress, setSubjectAddress] = useState(existingSar?.subjectAddress ?? '');
  const [subjectDob, setSubjectDob] = useState(existingSar?.subjectDob ?? '');
  const [activityType, setActivityType] = useState<SuspiciousActivityType>(existingSar?.activityType ?? 'Money Laundering');
  const [activityStartDate, setActivityStartDate] = useState(existingSar?.activityStartDate ?? fraudCase?.createdDate?.split('T')[0] ?? '');
  const [activityEndDate, setActivityEndDate] = useState(existingSar?.activityEndDate ?? '');
  const [totalAmount, setTotalAmount] = useState(existingSar?.totalAmountInvolved?.toString() ?? fraudCase?.totalAmount?.toString() ?? '');
  const [narrative, setNarrative] = useState(existingSar?.narrative ?? '');

  /* Auto-generate a suggested narrative from case and escalation data */
  const suggestedNarrative = useMemo(() => {
    if (!fraudCase) return '';
    const parts = [
      `This SAR is filed in connection with case ${fraudCase.caseId} (${fraudCase.caseName}).`,
      `The subject, ${fraudCase.customerName} (Customer ID: ${fraudCase.customerId}, Account: ${fraudCase.accountNumber}), is associated with suspicious activity categorized as ${fraudCase.category}.`,
      `The total amount involved is ${formatCurrency(fraudCase.totalAmount)} across ${fraudCase.transactionCount} transactions.`,
      `The case was flagged by ${fraudCase.alertSource} in the ${fraudCase.region} region with a risk score of ${fraudCase.riskScore}/100.`,
    ];
    if (escalation) {
      parts.push(`The case was escalated by ${escalation.escalatedByName} for reason: ${escalation.reason}.`);
      if (escalation.notes) parts.push(`Escalation notes: ${escalation.notes}`);
    }
    parts.push(`\nCase investigation notes: ${fraudCase.notes}`);
    return parts.join(' ');
  }, [fraudCase, escalation]);

  /* Build SAR data from form fields */
  const buildSarData = () => ({
    sarId: existingSar?.sarId ?? nextSarId(),
    caseId: caseId!,
    subjectName,
    subjectIdType,
    subjectIdNumber,
    subjectAddress,
    subjectDob,
    activityType,
    activityStartDate,
    activityEndDate,
    totalAmountInvolved: parseFloat(totalAmount) || 0,
    narrative,
    filingDate: '',
    createdBy: existingSar?.createdBy ?? user!.username,
    createdByName: existingSar?.createdByName ?? user!.displayName,
    createdAt: existingSar?.createdAt ?? new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    reviewedBy: existingSar?.reviewedBy ?? '',
    reviewedByName: existingSar?.reviewedByName ?? '',
    reviewNotes: existingSar?.reviewNotes ?? '',
    referredBy: referral?.referredBy ?? '',
    referredByName: referral?.referredByName ?? '',
  });

  /* Save as draft without submitting for review */
  const handleSaveDraft = (e: FormEvent) => {
    e.preventDefault();
    const sarData = { ...buildSarData(), status: 'Draft' as const };
    if (existingSar) {
      updateSar(existingSar.sarId, sarData);
    } else {
      createSar(sarData);
    }
    navigate('/sar');
  };

  /* Submit the SAR for supervisor review */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sarData = { ...buildSarData(), status: 'Pending Review' as const };
    if (existingSar) {
      updateSar(existingSar.sarId, sarData);
      submitForReview(existingSar.sarId);
    } else {
      createSar(sarData);
    }
    navigate('/sar');
  };

  if (!fraudCase) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/sar')}>← Back to SAR Dashboard</button>
        <div style={{ textAlign: 'center', padding: 48, color: '#5a6d82' }}>
          Case not found or not referred for SAR filing.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/sar')}>← Back to SAR Dashboard</button>

      <div style={styles.title}>
        {existingSar ? `Edit SAR: ${existingSar.sarId}` : 'Create New SAR'}
      </div>
      <div style={styles.subtitle}>
        Suspicious Activity Report for {fraudCase.caseId} — {fraudCase.caseName}
      </div>

      {/* Show revision notes if supervisor requested changes */}
      {existingSar?.status === 'Revision Requested' && (
        <div style={styles.revisionBanner}>
          <div style={styles.revisionTitle}>Revision Requested by {existingSar.reviewedByName}</div>
          <div style={styles.revisionText}>{existingSar.reviewNotes}</div>
        </div>
      )}

      {/* Case reference information */}
      <div style={styles.caseBanner}>
        <div>
          <div style={styles.caseBannerItem}>Case ID</div>
          <div style={styles.caseBannerValue}>{fraudCase.caseId}</div>
        </div>
        <div>
          <div style={styles.caseBannerItem}>Category</div>
          <div style={styles.caseBannerValue}>{fraudCase.category}</div>
        </div>
        <div>
          <div style={styles.caseBannerItem}>Risk Score</div>
          <div style={styles.caseBannerValue}>{fraudCase.riskScore}/100</div>
        </div>
        <div>
          <div style={styles.caseBannerItem}>Amount</div>
          <div style={styles.caseBannerValue}>{formatCurrency(fraudCase.totalAmount)}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Subject Information */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Subject Information</div>
          <div style={styles.fieldGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Subject Name</label>
              <input style={styles.input} value={subjectName} onChange={e => setSubjectName(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Date of Birth</label>
              <input style={styles.input} type="date" value={subjectDob} onChange={e => setSubjectDob(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>ID Type</label>
              <select style={styles.select} value={subjectIdType} onChange={e => setSubjectIdType(e.target.value)}>
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>ID Number</label>
              <input style={styles.input} value={subjectIdNumber} onChange={e => setSubjectIdNumber(e.target.value)} placeholder="e.g., XXX-XX-XXXX" />
            </div>
            <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Address</label>
              <input style={styles.input} value={subjectAddress} onChange={e => setSubjectAddress(e.target.value)} placeholder="Street, City, State, ZIP" />
            </div>
          </div>
        </div>

        {/* Section 2: Suspicious Activity Details */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Suspicious Activity Details</div>
          <div style={styles.fieldGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Activity Type</label>
              <select style={styles.select} value={activityType} onChange={e => setActivityType(e.target.value as SuspiciousActivityType)}>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Total Amount Involved ($)</label>
              <input style={styles.input} type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Activity Start Date</label>
              <input style={styles.input} type="date" value={activityStartDate} onChange={e => setActivityStartDate(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Activity End Date</label>
              <input style={styles.input} type="date" value={activityEndDate} onChange={e => setActivityEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 3: Narrative */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            Narrative
            {!narrative && (
              <button
                type="button"
                style={{ marginLeft: 12, fontSize: 11, color: '#00b4d8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setNarrative(suggestedNarrative)}
              >
                Auto-generate from case data
              </button>
            )}
          </div>
          <div style={styles.textareaField}>
            <label style={styles.label}>SAR Narrative (required for filing)</label>
            <textarea
              style={styles.textarea}
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              placeholder="Describe the suspicious activity in detail, including who, what, when, where, why, and how..."
              required
            />
          </div>
        </div>

        {/* Form action buttons */}
        <div style={styles.actions}>
          <button type="button" style={styles.draftBtn} onClick={handleSaveDraft}>
            Save as Draft
          </button>
          <button type="submit" style={styles.submitBtn}>
            Submit for Review
          </button>
        </div>
      </form>
    </div>
  );
}
