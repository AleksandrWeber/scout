import { FormEvent, useState } from 'react';
import { useAppPreferences } from '../context/AppPreferencesContext';

interface Props {
  onAnalyze: (repoUrl: string) => Promise<void>;
  onClear: () => void;
  loading: boolean;
}

const GitHubInput = ({ onAnalyze, onClear, loading }: Props) => {
  const { colors, t } = useAppPreferences();
  const [value, setValue] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    await onAnalyze(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onClear();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://github.com/owner/repo"
          style={{
            flex: 1,
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
        {t('githubHintPrefix')} <code>GITHUB_TOKEN</code> {t('githubHintSuffix')}
      </p>
    </div>
  );
};

export default GitHubInput;
