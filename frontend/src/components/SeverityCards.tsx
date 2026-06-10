import { Finding } from '../types';

interface Props {
  findings: Finding[];
  activeSeverity?: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL';
  onSeveritySelect?: (severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL') => void;
}

const severityColors = {
  HIGH: '#dc2626',
  MEDIUM: '#d97706',
  LOW: '#2563eb'
};

const SeverityCards = ({ findings, activeSeverity = 'ALL', onSeveritySelect }: Props) => {
  const countBySeverity = findings.reduce(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    { HIGH: 0, MEDIUM: 0, LOW: 0 }
  );

  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
      {(['HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => {
        const isActive = activeSeverity === severity;

        return (
          <button
            key={severity}
            type="button"
            onClick={() => onSeveritySelect?.(isActive ? 'ALL' : severity)}
            style={{
              padding: 16,
              borderRadius: 12,
              border: `2px solid ${isActive ? severityColors[severity] : '#e5e7eb'}`,
              flex: 1,
              textAlign: 'left',
              background: isActive ? `${severityColors[severity]}10` : '#ffffff',
              cursor: onSeveritySelect ? 'pointer' : 'default'
            }}
          >
            <div style={{ fontWeight: 700, color: severityColors[severity] }}>{severity}</div>
            <div style={{ marginTop: 8, fontSize: 24 }}>{countBySeverity[severity]}</div>
          </button>
        );
      })}
    </div>
  );
};

export default SeverityCards;
