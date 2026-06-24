import { useAppPreferences } from '../context/AppPreferencesContext';
import { ResultsView } from './ResultsViewTabs';

interface Props {
  activeView: ResultsView;
  codeCount: number;
  dependencyCount: number;
  onChange: (view: ResultsView) => void;
}

const ResultsViewTabs = ({ activeView, codeCount, dependencyCount, onChange }: Props) => {
  const { colors, t } = useAppPreferences();

  const tabs: Array<{ id: ResultsView; label: string; count: number }> = [
    { id: 'code', label: t('codeFindingsTab'), count: codeCount },
    { id: 'dependencies', label: t('dependenciesTab'), count: dependencyCount }
  ];

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: `1px solid ${isActive ? colors.tabActiveBorder : colors.tabInactiveBorder}`,
              background: isActive ? colors.tabActiveBg : colors.tabInactiveBg,
              color: isActive ? colors.tabActiveText : colors.tabInactiveText,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {tab.label} ({tab.count})
          </button>
        );
      })}
    </div>
  );
};

export type { ResultsView };
export default ResultsViewTabs;
