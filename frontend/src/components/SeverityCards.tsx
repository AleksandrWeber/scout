import { Finding } from '../types';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { getSeverityBadgeStyle, normalizeSeverity, SEVERITY_COLORS, SEVERITY_ORDER } from '../constants/severity';
import { getSeverityLabel } from '@shared/localization';

interface Props {
  findings: Finding[];
  activeSeverity?: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL';
  onSeveritySelect?: (severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL') => void;
}

const SeverityCards = ({ findings, activeSeverity = 'ALL', onSeveritySelect }: Props) => {
  const { colors, locale } = useAppPreferences();

  const countBySeverity = findings.reduce(
    (counts, finding) => {
      counts[normalizeSeverity(finding.severity)] += 1;
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
              border: `2px solid ${isActive ? SEVERITY_COLORS[severity] : colors.severityCardInactiveBorder}`,
              flex: 1,
              textAlign: 'left',
              background: isActive ? `${SEVERITY_COLORS[severity]}10` : colors.severityCardBg,
              cursor: onSeveritySelect ? 'pointer' : 'default',
              color: colors.severityCardText
            }}
          >
            <span style={getSeverityBadgeStyle(severity)}>{getSeverityLabel(severity, locale)}</span>
            <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>{countBySeverity[severity]}</div>
          </button>
        );
      })}
    </div>
  );
};

export default SeverityCards;
