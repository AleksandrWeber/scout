import { useState } from 'react';
import GitHubInput from './components/GitHubInput';
import SeverityCards from './components/SeverityCards';
import VulnerabilityCard from './components/VulnerabilityCard';
import SemgrepStatus from './components/SemgrepStatus';
import { AnalysisReport, Finding, SemgrepStatusType } from './types';

function App() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semgrepStatus, setSemgrepStatus] = useState<SemgrepStatusType>('unknown');
  const [semgrepMessage, setSemgrepMessage] = useState<string | null>(null);
  const [semgrepCount, setSemgrepCount] = useState<number | null>(null);
  const [analyzedRepo, setAnalyzedRepo] = useState<string | null>(null);

  const analyzeRepo = async (url: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = (await response.json()) as AnalysisReport;
      setFindings(data.findings || []);
      setAnalyzedRepo(data.repoUrl || url);
      setSemgrepStatus(data.semgrep?.status ?? 'unknown');
      setSemgrepMessage(data.semgrep?.message ?? null);
      setSemgrepCount(data.semgrep?.count ?? null);
    } catch (err) {
      setError((err as Error).message);
      setSemgrepStatus('failed');
      setSemgrepMessage('Could not fetch Semgrep analysis status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <header>
        <h1>Scout</h1>
        <p>AI-powered AppSec assistant for GitHub repositories.</p>
      </header>

      <GitHubInput onAnalyze={analyzeRepo} loading={loading} />

      {loading && <div style={{ marginTop: 16 }}>Analyzing repository… please wait.</div>}

      {analyzedRepo && !loading && (
        <div style={{ marginTop: 16, padding: 16, border: '1px solid #d1d5db', borderRadius: 12 }}>
          <strong>Analyzed repository:</strong> {analyzedRepo}
        </div>
      )}

      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

      <SemgrepStatus status={semgrepStatus} message={semgrepMessage} count={semgrepCount} />

      <SeverityCards findings={findings} />

      <section style={{ marginTop: 24 }}>
        {findings.length === 0 && !loading && (
          <p>{analyzedRepo ? 'No findings were detected for this repository.' : 'No findings yet. Enter a GitHub URL to start analysis.'}</p>
        )}

        {findings.map((finding, index) => (
          <VulnerabilityCard key={`${finding.file}-${index}`} finding={finding} />
        ))}
      </section>
    </div>
  );
}

export default App;
