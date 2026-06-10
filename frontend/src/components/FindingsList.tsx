import VulnerabilityCard from './VulnerabilityCard';
import { Finding, FindingSeverity } from '../types';
import { getSeverityBadgeStyle } from '../constants/severity';

interface Props {
  groups: Array<{ key: string; label: string; findings: Finding[] }>;
  groupBy: 'none' | 'severity' | 'category' | 'file';
}

const FindingsList = ({ groups, groupBy }: Props) => {
  if (groups.every((group) => group.findings.length === 0)) {
    return <p style={{ marginTop: 16, color: '#6b7280' }}>No findings match the current filters.</p>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      {groups.map((group) => (
        <section key={group.key} style={{ marginBottom: 24 }}>
          {groupBy !== 'none' ? (
            <header
              style={{
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center'
              }}
            >
              {groupBy === 'severity' ? (
                <span style={getSeverityBadgeStyle(group.key as FindingSeverity)}>{group.key}</span>
              ) : (
                <strong>{group.label}</strong>
              )}
              <span style={{ color: '#6b7280' }}>{group.findings.length} finding(s)</span>
            </header>
          ) : null}

          {group.findings.map((finding, index) => (
            <VulnerabilityCard key={`${group.key}-${finding.file}-${finding.line ?? 'na'}-${index}`} finding={finding} />
          ))}
        </section>
      ))}
    </div>
  );
};

export default FindingsList;
