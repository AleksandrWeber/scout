import { FormEvent, useState } from 'react';
import { useAppPreferences } from '../context/AppPreferencesContext';

export type ScanMode = 'github' | 'local' | 'pullRequest';

export type ScanRequest = {
  mode: ScanMode;
  value: string;
};

interface Props {
  onAnalyze: (request: ScanRequest) => Promise<void>;
  onClear: () => void;
  loading: boolean;
}

const ScanInput = ({ onAnalyze, onClear, loading }: Props) => {
  const { colors, t } = useAppPreferences();
  const [mode, setMode] = useState<ScanMode>('github');
  const [value, setValue] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }

    await onAnalyze({ mode, value: value.trim() });
  };

  const handleClear = () => {
    setValue('');
    onClear();
  };

  const tabStyle = (active: boolean) => ({
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${active ? colors.toggleActiveBg : colors.toggleBorder}`,
    background: active ? colors.toggleActiveBg : colors.toggleInactiveBg,
    color: active ? colors.toggleActiveText : colors.toggleInactiveText,
    cursor: 'pointer'
  });

  return (
    <div>
      <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={tabStyle(mode === 'github')} onClick={() => setMode('github')}>
          {t('scanSourceGitHub')}
        </button>
        <button type="button" style={tabStyle(mode === 'local')} onClick={() => setMode('local')}>
          {t('scanSourceLocal')}
        </button>
        <button type="button" style={tabStyle(mode === 'pullRequest')} onClick={() => setMode('pullRequest')}>
          {t('scanSourcePullRequest')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            mode === 'github'
              ? t('githubUrlPlaceholder')
              : mode === 'local'
                ? t('localPathPlaceholder')
                : t('pullRequestUrlPlaceholder')
          }
          style={{
            flex: 1,
            minWidth: 260,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${colors.inputBorder}`,
            background: colors.inputBg,
            color: colors.text
          }}
        />
        <button type="submit" disabled={loading} style={{ padding: '12px 20px', borderRadius: 8 }}>
          {loading ? t('analyzing') : t('analyze')}
        </button>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            border: `1px solid ${colors.inputBorder}`,
            background: colors.buttonSecondaryBg,
            color: colors.buttonSecondaryText
          }}
        >
          {t('clear')}
        </button>
      </form>

      <p style={{ marginTop: 10, color: colors.textMuted, fontSize: 14 }}>
        {mode === 'github' ? (
          <>
            {t('githubHintPrefix')} <code>GITHUB_TOKEN</code> {t('githubHintSuffix')}
          </>
        ) : mode === 'local' ? (
          t('localPathHint')
        ) : (
          t('pullRequestHint')
        )}
      </p>
    </div>
  );
};

export default ScanInput;
