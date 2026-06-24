import { SemgrepStatusType } from '../types';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { TranslationKey } from '../i18n/translations';

interface Props {
  status: SemgrepStatusType;
  message?: string | null;
  count?: number | null;
}

const SemgrepStatus = ({ status, message, count }: Props) => {
  const { colors, t } = useAppPreferences();

  const statusMap: Record<SemgrepStatusType, { labelKey: TranslationKey; color: string }> = {
    success: { labelKey: 'semgrepOk', color: '#16a34a' },
    failed: { labelKey: 'semgrepFailed', color: '#dc2626' },
    unknown: { labelKey: 'semgrepUnknown', color: '#ca8a04' }
  };

  const info = statusMap[status] ?? statusMap.unknown;

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
      <span style={{ color: info.color, fontWeight: 700 }}>{t(info.labelKey)}</span>
      {message && <span style={{ color: colors.semgrepMessage }}>{message}</span>}
      {typeof count === 'number' && (
        <span style={{ color: colors.semgrepMessage }}>{t('semgrepFindings', { count })}</span>
      )}
    </div>
  );
};

export default SemgrepStatus;
