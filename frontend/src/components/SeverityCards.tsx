import { Finding } from '../types';

interface Props {
  findings: Finding[];
}

const SeverityCards = ({ findings }: Props) => {
  const countBySeverity = findings.reduce(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    { HIGH: 0, MEDIUM: 0, LOW: 0 }
  );

  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
      {(['HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => (
        <div
          key={severity}
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            flex: 1
          }}
        >
          <div style={{ fontWeight: 700 }}>{severity}</div>
          <div style={{ marginTop: 8, fontSize: 24 }}>{countBySeverity[severity]}</div>
        </div>
      ))}
    </div>
  );
};

export default SeverityCards;
