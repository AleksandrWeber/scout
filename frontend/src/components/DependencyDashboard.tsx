import { DependencyPackageGroup, formatCveList } from '../utils/dependency-dashboard';
import { getSeverityBadgeStyle, normalizeSeverity } from '../constants/severity';
import { Finding } from '../types';

interface Props {
  groups: DependencyPackageGroup[];
}

const DependencyFindingRow = ({ finding }: { finding: Finding }) => {
  const details = finding.dependency;

  return (
    <div
      style={{
        padding: 12,
        border: '1px solid #f3f4f6',
        borderRadius: 10,
        background: '#ffffff'
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={getSeverityBadgeStyle(normalizeSeverity(finding.severity))}>
          {normalizeSeverity(finding.severity)}
        </span>
        {details?.exploitAvailable ? (
          <span style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>Exploit likely</span>
        ) : null}
        {details?.priorityScore ? (
          <span style={{ fontSize: 12, color: '#6b7280' }}>Priority {details.priorityScore}</span>
        ) : null}
      </div>
      <p style={{ marginTop: 10, marginBottom: 8, color: '#111827' }}>{finding.description}</p>
      <div style={{ fontSize: 14, color: '#4b5563', display: 'grid', gap: 6 }}>
        <div>
          <strong>CVE:</strong> {formatCveList(details?.cveIds || [])}
        </div>
        <div>
          <strong>Affected:</strong> {details?.vulnerableVersions || 'Unknown range'}
        </div>
        <div>
          <strong>Fixed in:</strong> {details?.patchedVersion || 'See npm advisory'}
        </div>
        <div>
          <strong>Fix:</strong> {finding.fix}
        </div>
      </div>
    </div>
  );
};

const DependencyDashboard = ({ groups }: Props) => {
  if (groups.length === 0) {
    return (
      <p style={{ marginTop: 16, color: '#6b7280' }}>
        No dependency vulnerabilities were reported for this repository.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
      {groups.map((group) => (
        <section
          key={group.packageName}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            background: '#f9fafb'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong style={{ fontSize: 18 }}>{group.packageName}</strong>
              <div style={{ marginTop: 6, color: '#6b7280', fontSize: 14 }}>
                {group.findings.length} {group.findings.length === 1 ? 'advisory' : 'advisories'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={getSeverityBadgeStyle(group.highestSeverity)}>{group.highestSeverity}</span>
              {group.exploitAvailable ? (
                <span style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>Exploit likely</span>
              ) : null}
              <span style={{ fontSize: 12, color: '#6b7280' }}>Priority {group.priorityScore}</span>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {group.findings.map((finding, index) => (
              <DependencyFindingRow key={`${group.packageName}-${index}`} finding={finding} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default DependencyDashboard;
