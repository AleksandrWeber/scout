import { useAppPreferences } from '../context/AppPreferencesContext';

type ReportActionsBarProps = {
  onGenerateReport: () => void;
};

const ReportActionsBar = ({ onGenerateReport }: ReportActionsBarProps) => {
  const { colors, t } = useAppPreferences();

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        marginTop: 24,
        padding: '14px 16px',
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        background: colors.cardBg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.08)'
      }}
    >
      <div style={{ color: colors.textMuted }}>{t('reportActionsHint')}</div>
      <button
        type="button"
        onClick={onGenerateReport}
        style={{
          border: `1px solid ${colors.toggleActiveBg}`,
          background: colors.toggleActiveBg,
          color: colors.toggleActiveText,
          borderRadius: 10,
          padding: '10px 16px',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        {t('reportGenerateAction')}
      </button>
    </div>
  );
};

export default ReportActionsBar;
