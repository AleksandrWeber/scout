import { formatScanTimestamp } from './format-scan-time';
import { buildExecutiveNarrativeFallback } from './executive-narrative-fallback';
import { escapeHtml } from './html-utils';
import { getReportLabels } from './labels';
import { buildReportFileName, countFindingsBySeverity, renderReportShell } from './report-helpers';
import type { GeneratedReport, ReportBuildInput } from './types';

export const buildExecutiveReport = (input: ReportBuildInput): GeneratedReport => {
  const labels = getReportLabels(input.locale);
  const title = labels.executiveTitle;
  const allFindings = [...input.findings, ...input.dependencyFindings];
  const severityCounts = countFindingsBySeverity(allFindings);
  const narrative = input.executiveNarrative ?? buildExecutiveNarrativeFallback(input);
  const { overview, priorities, nextSteps } = narrative;
  const scannedAtLabel = formatScanTimestamp(input.scannedAt, input.locale);

  const body = `
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p class="muted">${escapeHtml(labels.generatedBy)}</p>
  </header>
  <dl class="meta">
    <dt>${escapeHtml(labels.project)}</dt>
    <dd>${escapeHtml(input.projectName)}</dd>
    <dt>${escapeHtml(labels.repository)}</dt>
    <dd>${escapeHtml(input.repoUrl)}</dd>
    <dt>${escapeHtml(labels.scannedAt)}</dt>
    <dd>${escapeHtml(scannedAtLabel)}</dd>
  </dl>
  <p>${escapeHtml(labels.executiveIntro)}</p>
  <h2>${escapeHtml(labels.executiveOverview)}</h2>
  <p>${escapeHtml(overview)}</p>
  <div class="summary-grid">
    <div class="summary-card"><span class="muted">${escapeHtml(labels.totalFindings)}</span><strong>${input.summary.total}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.high)}</span><strong>${severityCounts.HIGH}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.medium)}</span><strong>${severityCounts.MEDIUM}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.low)}</span><strong>${severityCounts.LOW}</strong></div>
  </div>
  <h2>${escapeHtml(labels.executivePriorities)}</h2>
  <ol>${priorities.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
  <h2>${escapeHtml(labels.executiveNextSteps)}</h2>
  <ul>${nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
  <h2>${escapeHtml(labels.executiveGlossaryTitle)}</h2>
  <ul>
    <li>${escapeHtml(labels.executiveGlossaryCve)}</li>
    <li>${escapeHtml(labels.executiveGlossarySeverity)}</li>
  </ul>
  <p class="footer">${escapeHtml(labels.generatedBy)} · ${escapeHtml(scannedAtLabel)}</p>`;

  const html = renderReportShell({
    title: `${title} — ${input.projectName}`,
    body,
    notice: labels.confidentialNotice
  });

  const plainText = [
    title,
    `${labels.project}: ${input.projectName}`,
    `${labels.repository}: ${input.repoUrl}`,
    `${labels.scannedAt}: ${scannedAtLabel}`,
    '',
    overview,
    '',
    `${labels.executivePriorities}:\n- ${priorities.join('\n- ')}`
  ].join('\n');

  return {
    kind: 'executive',
    title,
    html,
    plainText,
    fileName: buildReportFileName(input.projectName, 'executive', input.scannedAt)
  };
};
