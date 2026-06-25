import type { Finding } from '../types';
import { escapeHtml } from './html-utils';

const SEVERITY_ORDER = ['HIGH', 'MEDIUM', 'LOW'] as const;

export const countFindingsBySeverity = (findings: Finding[]) => {
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const finding of findings) {
    const key = finding.severity.toUpperCase();
    if (key in counts) {
      counts[key as keyof typeof counts] += 1;
    }
  }

  return counts;
};

export const sortFindingsBySeverity = (findings: Finding[]): Finding[] =>
  [...findings].sort(
    (left, right) =>
      SEVERITY_ORDER.indexOf(left.severity) - SEVERITY_ORDER.indexOf(right.severity) ||
      left.file.localeCompare(right.file) ||
      (left.line ?? 0) - (right.line ?? 0)
  );

export const formatFindingLocation = (finding: Finding): string => {
  if (!finding.file) {
    return '—';
  }

  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
};

export const buildReportFileName = (projectName: string, kind: string, scannedAt: string): string => {
  const safeProject = projectName.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
  const datePart = scannedAt.slice(0, 10);
  return `scout-${kind}-${safeProject}-${datePart}.html`;
};

export const renderReportShell = (options: {
  title: string;
  body: string;
  notice: string;
}): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; color: #111827; margin: 0; padding: 32px; background: #fff; }
    h1, h2, h3 { line-height: 1.25; margin: 0 0 12px; }
    h1 { font-size: 1.75rem; }
    h2 { font-size: 1.25rem; margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    p, li { margin: 0 0 10px; }
    .meta { display: grid; gap: 8px; margin: 20px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; }
    .meta dt { font-weight: 600; color: #374151; }
    .meta dd { margin: 0 0 8px; color: #111827; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 16px 0 24px; }
    .summary-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #fff; }
    .summary-card strong { display: block; font-size: 1.4rem; }
    .finding { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 0 0 14px; page-break-inside: avoid; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
    .badge-high { background: #fee2e2; color: #991b1b; }
    .badge-medium { background: #ffedd5; color: #9a3412; }
    .badge-low { background: #fef9c3; color: #854d0e; }
    .muted { color: #6b7280; font-size: 0.95rem; }
    .notice { margin-top: 28px; padding: 12px 14px; border-left: 4px solid #f59e0b; background: #fffbeb; color: #92400e; }
    .footer { margin-top: 32px; color: #6b7280; font-size: 0.9rem; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
${options.body}
  <p class="notice">${escapeHtml(options.notice)}</p>
</body>
</html>`;

export const severityBadgeClass = (severity: string): string => {
  const normalized = severity.toUpperCase();
  if (normalized === 'HIGH') return 'badge-high';
  if (normalized === 'MEDIUM') return 'badge-medium';
  return 'badge-low';
};
