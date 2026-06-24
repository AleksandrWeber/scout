export type ResultsView = 'code' | 'dependencies';

interface Props {
  activeView: ResultsView;
  codeCount: number;
  dependencyCount: number;
  onChange: (view: ResultsView) => void;
}

const ResultsViewTabs = ({ activeView, codeCount, dependencyCount, onChange }: Props) => {
  const tabs: Array<{ id: ResultsView; label: string; count: number }> = [
    { id: 'code', label: 'Code findings', count: codeCount },
    { id: 'dependencies', label: 'Dependencies', count: dependencyCount }
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
              border: `1px solid ${isActive ? '#111827' : '#d1d5db'}`,
              background: isActive ? '#111827' : '#ffffff',
              color: isActive ? '#ffffff' : '#374151',
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

export default ResultsViewTabs;
