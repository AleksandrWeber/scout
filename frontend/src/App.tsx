import { useMemo, useRef, useState } from 'react';
import GitHubInput from './components/GitHubInput';
import SeverityCards from './components/SeverityCards';
import FindingsToolbar from './components/FindingsToolbar';
import FindingsList from './components/FindingsList';
import SemgrepStatus from './components/SemgrepStatus';
import { AnalysisReport, Finding, SemgrepStatusType } from './types';
import {
  defaultFindingsFilters,
  filterFindings,
  getUniqueCategories,
  groupFindings
} from './utils/findings-filters';

function App() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filters, setFilters] = useState(defaultFindingsFilters());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [semgrepStatus, setSemgrepStatus] = useState<SemgrepStatusType>('unknown');
  const [semgrepMessage, setSemgrepMessage] = useState<string | null>(null);
  const [semgrepCount, setSemgrepCount] = useState<number | null>(null);
  const [analyzedRepo, setAnalyzedRepo] = useState<string | null>(null);
  const analysisRequestId = useRef(0);

  const categories = useMemo(() => getUniqueCategories(findings), [findings]);
  const filteredFindings = useMemo(() => filterFindings(findings, filters), [findings, filters]);
  const groupedFindings = useMemo(
    () => groupFindings(filteredFindings, filters.groupBy),
    [filteredFindings, filters.groupBy]
  );

  const analyzeRepo = async (url: string) => {
    const requestId = ++analysisRequestId.current;
    setLoading(true);
    setError(null);
    setErrorHint(null);
    setFilters(defaultFindingsFilters());

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url })
      });

      if (requestId !== analysisRequestId.current) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setErrorHint(typeof errorData.hint === 'string' ? errorData.hint : null);
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = (await response.json()) as AnalysisReport;

      if (requestId !== analysisRequestId.current) {
        return;
      }

      setFindings(data.findings || []);
      setAnalyzedRepo(data.repoUrl || url);
      setSemgrepStatus(data.semgrep?.status ?? 'unknown');
      setSemgrepMessage(data.semgrep?.message ?? null);
      setSemgrepCount(data.semgrep?.count ?? null);
    } catch (err) {
      if (requestId !== analysisRequestId.current) {
        return;
      }

      setError((err as Error).message);
      setSemgrepStatus('failed');
      setSemgrepMessage('Could not fetch Semgrep analysis status.');
    } finally {
      if (requestId === analysisRequestId.current) {
        setLoading(false);
      }
    }
  };

  const clearAnalysis = () => {
    analysisRequestId.current += 1;
    setLoading(false);
    setFindings([]);
    setFilters(defaultFindingsFilters());
    setError(null);
    setErrorHint(null);
    setSemgrepStatus('unknown');
    setSemgrepMessage(null);
    setSemgrepCount(null);
    setAnalyzedRepo(null);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <header>
        <h1>Scout</h1>
        <p>AI-powered AppSec assistant for GitHub repositories.</p>
      </header>

      <GitHubInput onAnalyze={analyzeRepo} onClear={clearAnalysis} loading={loading} />

      {loading && <div style={{ marginTop: 16 }}>Analyzing repository… please wait.</div>}

      {analyzedRepo && !loading && (
        <div style={{ marginTop: 16, padding: 16, border: '1px solid #d1d5db', borderRadius: 12 }}>
          <strong>Analyzed repository:</strong> {analyzedRepo}
        </div>
      )}

      {error && (
        <div style={{ color: '#b91c1c', marginTop: 12 }}>
          <div>{error}</div>
          {errorHint ? <div style={{ marginTop: 8, color: '#7f1d1d' }}>{errorHint}</div> : null}
        </div>
      )}

      <SemgrepStatus status={semgrepStatus} message={semgrepMessage} count={semgrepCount} />

      {findings.length > 0 && (
        <>
          <SeverityCards
            findings={findings}
            activeSeverity={filters.severity}
            onSeveritySelect={(severity) => setFilters((current) => ({ ...current, severity }))}
          />

          <FindingsToolbar
            filters={filters}
            categories={categories}
            filteredCount={filteredFindings.length}
            totalCount={findings.length}
            onChange={setFilters}
          />

          <FindingsList groups={groupedFindings} groupBy={filters.groupBy} />
        </>
      )}

      {findings.length === 0 && !loading && (
        <p style={{ marginTop: 24 }}>
          {analyzedRepo
            ? 'No findings were detected for this repository.'
            : 'No findings yet. Enter a GitHub URL to start analysis.'}
        </p>
      )}
    </div>
  );
}

export default App;
