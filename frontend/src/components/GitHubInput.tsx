import { FormEvent, useState } from 'react';

interface Props {
  onAnalyze: (repoUrl: string) => Promise<void>;
  loading: boolean;
}

const GitHubInput = ({ onAnalyze, loading }: Props) => {
  const [value, setValue] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    await onAnalyze(value.trim());
  };

  return (
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
    </form>
  );
};

export default GitHubInput;
