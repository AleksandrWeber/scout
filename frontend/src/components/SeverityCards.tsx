import { Finding } from '../types';
import { getSeverityBadgeStyle, SEVERITY_COLORS, SEVERITY_ORDER } from '../constants/severity';

interface Props {
  findings: Finding[];
  activeSeverity?: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL';
  onSeveritySelect?: (severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL') => void;
}

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
      {SEVERITY_ORDER.map((severity) => {
        const isActive = activeSeverity === severity;

        return (
          <button
            key={severity}
            type="button"
            onClick={() => onSeveritySelect?.(isActive ? 'ALL' : severity)}
            style={{
              padding: 16,
              borderRadius: 12,
              border: `2px solid ${isActive ? SEVERITY_COLORS[severity] : '#e5e7eb'}`,
              flex: 1,
              textAlign: 'left',
              background: isActive ? `${SEVERITY_COLORS[severity]}10` : '#ffffff',
              cursor: onSeveritySelect ? 'pointer' : 'default'
            }}
          >
            <span style={getSeverityBadgeStyle(severity)}>{severity}</span>
            <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700, color: '#111827' }}>
              {countBySeverity[severity]}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SeverityCards;
