import { FormEvent, useState } from 'react';

interface Props {
  onAnalyze: (repoUrl: string) => Promise<void>;
  onClear: () => void;
  loading: boolean;
}

const GitHubInput = ({ onAnalyze, onClear, loading }: Props) => {
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
          style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '12px 20px', borderRadius: 8 }}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#374151'
          }}
        >
          Очистити
        </button>
      </form>
      <p style={{ marginTop: 10, color: '#6b7280', fontSize: 14 }}>
        Public repos work without setup. Private repos need <code>GITHUB_TOKEN</code> in the backend <code>.env</code> file.
      </p>
    </div>
  );
};

export default GitHubInput;
