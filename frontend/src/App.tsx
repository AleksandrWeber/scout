import { useMemo, useRef, useState } from 'react';
import ScanInput, { ScanRequest } from './components/ScanInput';
import SeverityCards from './components/SeverityCards';
import FindingsToolbar from './components/FindingsToolbar';
import FindingsList from './components/FindingsList';
import SemgrepStatus from './components/SemgrepStatus';
import ResultsViewTabs, { ResultsView } from './components/ResultsViewTabs';
import DependencyDashboard from './components/DependencyDashboard';
import PreferencesBar from './components/PreferencesBar';
import ReportActionsBar from './components/ReportActionsBar';
import ReportFlowModal from './components/ReportFlowModal';
import { useAppPreferences } from './context/AppPreferencesContext';
import { AnalysisReport, Finding, SemgrepStatusType } from './types';
import { getProjectNameFromRepoUrl, type ReportBuildInput } from '@shared/reports';
import {
  defaultFindingsFilters,
  filterFindings,
  getUniqueCategories,
  groupFindings
} from './utils/findings-filters';
import { groupDependencyFindingsByPackage } from './utils/dependency-dashboard';

function App() {
  const { colors, locale, t } = useAppPreferences();
  const [codeFindings, setCodeFindings] = useState<Finding[]>([]);
  const [dependencyFindings, setDependencyFindings] = useState<Finding[]>([]);
  const [activeView, setActiveView] = useState<ResultsView>('code');
  const [filters, setFilters] = useState(defaultFindingsFilters());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [semgrepStatus, setSemgrepStatus] = useState<SemgrepStatusType>('unknown');
  const [semgrepMessage, setSemgrepMessage] = useState<string | null>(null);
  const [semgrepCount, setSemgrepCount] = useState<number | null>(null);
  const [analyzedRepo, setAnalyzedRepo] = useState<string | null>(null);
  const [analyzedProjectName, setAnalyzedProjectName] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<'github' | 'local'>('github');
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [reportSummary, setReportSummary] = useState<AnalysisReport['summary'] | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const analysisRequestId = useRef(0);

  const categories = useMemo(() => getUniqueCategories(codeFindings), [codeFindings]);
  const filteredFindings = useMemo(() => filterFindings(codeFindings, filters), [codeFindings, filters]);
  const groupedFindings = useMemo(
    () => groupFindings(filteredFindings, filters.groupBy),
    [filteredFindings, filters.groupBy]
  );
  const dependencyGroups = useMemo(
    () => groupDependencyFindingsByPackage(dependencyFindings),
    [dependencyFindings]
  );
  const hasResults = codeFindings.length > 0 || dependencyFindings.length > 0;

  const applyAnalysisResult = (data: AnalysisReport, fallbackTarget: string) => {
    setCodeFindings(data.findings || []);
    setDependencyFindings(data.dependencyFindings || []);
    setAnalyzedRepo(data.projectPath || data.repoUrl || fallbackTarget);
    setAnalyzedProjectName(data.projectName || getProjectNameFromRepoUrl(data.repoUrl || fallbackTarget));
    setAnalysisSource(data.source || 'github');
    setScannedAt(new Date().toISOString());
    setReportSummary(data.summary);
    setSemgrepStatus(data.semgrep?.status ?? 'unknown');
    setSemgrepMessage(data.semgrep?.message ?? null);
    setSemgrepCount(data.semgrep?.count ?? null);

    if ((data.findings || []).length === 0 && (data.dependencyFindings || []).length > 0) {
      setActiveView('dependencies');
    }
  };

  const analyzeScan = async ({ mode, value }: ScanRequest) => {
    const requestId = ++analysisRequestId.current;
    setLoading(true);
    setError(null);
    setErrorHint(null);
    setFilters(defaultFindingsFilters());
    setActiveView('code');

    const endpoint = mode === 'local' ? '/api/analyze/local' : '/api/analyze';
    const body =
      mode === 'local' ? { projectPath: value, locale } : { repoUrl: value, locale };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

      applyAnalysisResult(data, value);
    } catch (err) {
      if (requestId !== analysisRequestId.current) {
        return;
      }

      setError((err as Error).message);
      setSemgrepStatus('failed');
      setSemgrepMessage(t('semgrepStatusFetchFailed'));
    } finally {
      if (requestId === analysisRequestId.current) {
        setLoading(false);
      }
    }
  };

  const clearAnalysis = () => {
    analysisRequestId.current += 1;
    setLoading(false);
    setCodeFindings([]);
    setDependencyFindings([]);
    setActiveView('code');
    setFilters(defaultFindingsFilters());
    setError(null);
    setErrorHint(null);
    setSemgrepStatus('unknown');
    setSemgrepMessage(null);
    setSemgrepCount(null);
    setAnalyzedRepo(null);
    setAnalyzedProjectName(null);
    setAnalysisSource('github');
    setScannedAt(null);
    setReportSummary(null);
    setReportModalOpen(false);
  };

  const reportInput = useMemo<ReportBuildInput | null>(() => {
    if (!analyzedRepo || !scannedAt || !reportSummary) {
      return null;
    }

    return {
      projectName: analyzedProjectName || getProjectNameFromRepoUrl(analyzedRepo),
      repoUrl: analyzedRepo,
      scannedAt,
      locale,
      findings: codeFindings,
      dependencyFindings,
      summary: reportSummary,
      semgrep:
        semgrepStatus !== 'unknown'
          ? {
              status: semgrepStatus,
              message: semgrepMessage ?? undefined,
              count: semgrepCount ?? undefined
            }
          : undefined
    };
  }, [
    analyzedRepo,
    analyzedProjectName,
    scannedAt,
    reportSummary,
    locale,
    codeFindings,
    dependencyFindings,
    semgrepStatus,
    semgrepMessage,
    semgrepCount
  ]);

  return (
    <div
      style={{
        padding: 24,
        minHeight: '100vh',
        background: colors.pageBg,
        color: colors.text
      }}
    >
      <header>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <h1 style={{ margin: 0, lineHeight: 1.2 }}>Scout</h1>
          <PreferencesBar />
        </div>
        <p style={{ color: colors.textMuted, marginTop: 8 }}>{t('appTagline')}</p>
      </header>

      <ScanInput onAnalyze={analyzeScan} onClear={clearAnalysis} loading={loading} />

      {loading && <div style={{ marginTop: 16, color: colors.textSecondary }}>{t('analyzingWait')}</div>}

      {analyzedRepo && !loading && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            background: colors.cardBgMuted
          }}
        >
          <strong>{analysisSource === 'local' ? t('analyzedProject') : t('analyzedRepository')}</strong>{' '}
          {analyzedRepo}
        </div>
      )}

      {error && (
        <div style={{ color: colors.error, marginTop: 12 }}>
          <div>{error}</div>
          {errorHint ? <div style={{ marginTop: 8, color: colors.errorMuted }}>{errorHint}</div> : null}
        </div>
      )}

      <SemgrepStatus status={semgrepStatus} message={semgrepMessage} count={semgrepCount} />

      {hasResults && (
        <>
          <ResultsViewTabs
            activeView={activeView}
            codeCount={codeFindings.length}
            dependencyCount={dependencyFindings.length}
            onChange={setActiveView}
          />

          {activeView === 'code' ? (
            <>
              <SeverityCards
                findings={codeFindings}
                activeSeverity={filters.severity}
                onSeveritySelect={(severity) => setFilters((current) => ({ ...current, severity }))}
              />

              <FindingsToolbar
                filters={filters}
                categories={categories}
                filteredCount={filteredFindings.length}
                totalCount={codeFindings.length}
                onChange={setFilters}
              />

              {codeFindings.length > 0 ? (
                <FindingsList groups={groupedFindings} groupBy={filters.groupBy} />
              ) : (
                <p style={{ marginTop: 16, color: colors.textMuted }}>{t('noCodeFindings')}</p>
              )}
            </>
          ) : (
            <DependencyDashboard groups={dependencyGroups} />
          )}

          <ReportActionsBar onGenerateReport={() => setReportModalOpen(true)} />
        </>
      )}

      <ReportFlowModal
        open={reportModalOpen}
        input={reportInput}
        onClose={() => setReportModalOpen(false)}
      />

      {!hasResults && !loading && (
        <p style={{ marginTop: 24, color: colors.textSecondary }}>
          {analyzedRepo ? t('noFindingsRepo') : t('noFindingsYet')}
        </p>
      )}
    </div>
  );
}

export default App;
