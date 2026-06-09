import { SemgrepStatusType } from '../types';

interface Props {
  status: SemgrepStatusType;
  message?: string | null;
  count?: number | null;
}

const SemgrepStatus = ({ status, message, count }: Props) => {
  const statusMap: Record<SemgrepStatusType, { label: string; color: string }> = {
    success: { label: 'Semgrep OK', color: '#16a34a' },
    failed: { label: 'Semgrep Failed', color: '#dc2626' },
    unknown: { label: 'Semgrep Unknown', color: '#ca8a04' }
  };

  const info = statusMap[status];

  return (
    <div
      style={{
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
        border: `1px solid ${info.color}`,
        background: `${info.color}10`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <span style={{ color: info.color, fontWeight: 700 }}>{info.label}</span>
      {message && <span style={{ color: '#374151' }}>{message}</span>}
      {typeof count === 'number' && (
        <span style={{ color: '#374151' }}>Semgrep findings: {count}</span>
      )}
    </div>
  );
};

export default SemgrepStatus;
