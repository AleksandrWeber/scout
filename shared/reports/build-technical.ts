import { localizeFinding, type LocalizableFinding } from '../localization';
import type { Finding } from '../types';
import { formatScanTimestamp } from './format-scan-time';
import { escapeHtml } from './html-utils';
import { getReportLabels } from './labels';
import {
  buildReportFileName,
  countFindingsBySeverity,
  formatFindingLocation,
  renderReportShell,
  severityBadgeClass,
  sortFindingsBySeverity
} from './report-helpers';
import type { GeneratedReport, ReportBuildInput } from './types';

const renderMetaSection = (
  labels: ReturnType<typeof getReportLabels>,
  input: ReportBuildInput,
  title: string
): string => {
  const scannedAtLabel = formatScanTimestamp(input.scannedAt, input.locale);

  return `
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
  </dl>`;
};

const renderSummaryCards = (
  labels: ReturnType<typeof getReportLabels>,
  input: ReportBuildInput
): string => {
  const allFindings = [...input.findings, ...input.dependencyFindings];
  const severityCounts = countFindingsBySeverity(allFindings);

  return `
  <h2>${escapeHtml(labels.summary)}</h2>
  <div class="summary-grid">
    <div class="summary-card"><span class="muted">${escapeHtml(labels.totalFindings)}</span><strong>${input.summary.total}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.codeFindings)}</span><strong>${input.summary.codeFindings}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.dependencyFindings)}</span><strong>${input.summary.dependencyFindings}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.high)}</span><strong>${severityCounts.HIGH}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.medium)}</span><strong>${severityCounts.MEDIUM}</strong></div>
    <div class="summary-card"><span class="muted">${escapeHtml(labels.low)}</span><strong>${severityCounts.LOW}</strong></div>
  </div>
  ${
    input.semgrep
      ? `<p class="muted">${escapeHtml(labels.semgrepStatus)}: ${escapeHtml(input.semgrep.status)}${
          input.semgrep.count != null ? ` (${input.semgrep.count})` : ''
        }</p>`
      : ''
  }`;
};

const renderCodeFinding = (
  labels: ReturnType<typeof getReportLabels>,
  finding: Finding
): string => `
  <article class="finding">
    <p><span class="badge ${severityBadgeClass(finding.severity)}">${escapeHtml(finding.severity)}</span>
    <strong>${escapeHtml(finding.category)}</strong></p>
    <p><strong>${escapeHtml(labels.location)}:</strong> ${escapeHtml(formatFindingLocation(finding))}</p>
    <p><strong>${escapeHtml(labels.description)}:</strong> ${escapeHtml(finding.description)}</p>
    ${
      finding.owasp
        ? `<p><strong>OWASP:</strong> ${escapeHtml(finding.owasp.id)} — ${escapeHtml(finding.owasp.name)}</p>`
        : ''
    }
    <p><strong>${escapeHtml(labels.risk)}:</strong> ${escapeHtml(finding.risk)}</p>
    <p><strong>${escapeHtml(labels.fix)}:</strong> ${escapeHtml(finding.fix)}</p>
    ${
      finding.aiExplanation?.summary
        ? `<p><strong>AI:</strong> ${escapeHtml(finding.aiExplanation.summary)}</p>`
        : ''
    }
    ${
      finding.aiExplanation?.codeSample
        ? `<pre><code>${escapeHtml(finding.aiExplanation.codeSample)}</code></pre>`
        : ''
    }
  </article>`;

const renderDependencyFinding = (
  labels: ReturnType<typeof getReportLabels>,
  finding: Finding
): string => {
  const dependency = finding.dependency;

  return `
  <article class="finding">
    <p><span class="badge ${severityBadgeClass(finding.severity)}">${escapeHtml(finding.severity)}</span>
    <strong>${escapeHtml(dependency?.packageName || finding.category)}</strong></p>
    <p><strong>${escapeHtml(labels.description)}:</strong> ${escapeHtml(finding.description)}</p>
  ${
    dependency
      ? `
    <p><strong>${escapeHtml(labels.cve)}:</strong> ${escapeHtml(dependency.cveIds.join(', ') || '—')}</p>
    <p><strong>${escapeHtml(labels.affectedVersions)}:</strong> ${escapeHtml(dependency.vulnerableVersions || '—')}</p>
    <p><strong>${escapeHtml(labels.fixedIn)}:</strong> ${escapeHtml(dependency.patchedVersion || '—')}</p>
    <p><strong>${escapeHtml(labels.priority)}:</strong> ${dependency.priorityScore}</p>
    ${
      dependency.exploitAvailable
        ? `<p><strong>${escapeHtml(labels.exploitLikely)}:</strong> yes</p>`
        : ''
    }`
      : ''
  }
    <p><strong>${escapeHtml(labels.fix)}:</strong> ${escapeHtml(finding.fix)}</p>
  </article>`;
};

export const buildTechnicalReport = (input: ReportBuildInput): GeneratedReport => {
  const labels = getReportLabels(input.locale);
  const title = labels.technicalTitle;
  const localizedCodeFindings = sortFindingsBySeverity(input.findings).map((finding) =>
    localizeFinding(finding as LocalizableFinding, input.locale) as Finding
  );
  const localizedDependencyFindings = sortFindingsBySeverity(input.dependencyFindings).map((finding) =>
    localizeFinding(finding as LocalizableFinding, input.locale) as Finding
  );

  const body = `
  ${renderMetaSection(labels, input, title)}
  ${renderSummaryCards(labels, input)}
  <h2>${escapeHtml(labels.codeSection)}</h2>
  ${
    localizedCodeFindings.length > 0
      ? localizedCodeFindings.map((finding) => renderCodeFinding(labels, finding)).join('')
      : `<p>${escapeHtml(labels.noCodeFindings)}</p>`
  }
  <h2>${escapeHtml(labels.dependenciesSection)}</h2>
  ${
    localizedDependencyFindings.length > 0
      ? localizedDependencyFindings.map((finding) => renderDependencyFinding(labels, finding)).join('')
      : `<p>${escapeHtml(labels.noDependencyFindings)}</p>`
  }
  <p class="footer">${escapeHtml(labels.generatedBy)} · ${escapeHtml(formatScanTimestamp(input.scannedAt, input.locale))}</p>`;

  const html = renderReportShell({
    title: `${title} — ${input.projectName}`,
    body,
    notice: labels.confidentialNotice
  });

  const plainText = [
    title,
    `${labels.project}: ${input.projectName}`,
    `${labels.repository}: ${input.repoUrl}`,
    `${labels.scannedAt}: ${formatScanTimestamp(input.scannedAt, input.locale)}`,
    `${labels.totalFindings}: ${input.summary.total}`
  ].join('\n');

  return {
    kind: 'technical',
    title,
    html,
    plainText,
    fileName: buildReportFileName(input.projectName, 'technical', input.scannedAt)
  };
};
