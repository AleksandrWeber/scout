type ScanSummaryReport = {
  source?: string;
  projectName?: string;
  projectPath?: string;
  repoUrl: string;
  summary: {
    total: number;
    codeFindings: number;
    dependencyFindings: number;
  };
  findings: Array<{ severity: string; category: string; file: string; line?: number; description: string }>;
  dependencyFindings: Array<{ severity: string; description: string }>;
};

const countSeverity = (findings: Array<{ severity: string }>) => {
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const finding of findings) {
    const key = finding.severity.toUpperCase();
    if (key in counts) {
      counts[key as keyof typeof counts] += 1;
    }
  }

  return counts;
};

export const formatScanSummary = (report: ScanSummaryReport): string => {
  const allFindings = [...report.findings, ...report.dependencyFindings];
  const severity = countSeverity(allFindings);
  const projectLabel = report.projectName || report.repoUrl;
  const pathLabel = report.projectPath || report.repoUrl;

  const lines = [
    'Scout scan complete',
    `Source: ${report.source || 'github'}`,
    `Project: ${projectLabel}`,
    `Path: ${pathLabel}`,
    `Total findings: ${report.summary.total} (code: ${report.summary.codeFindings}, dependencies: ${report.summary.dependencyFindings})`,
    `Severity: HIGH ${severity.HIGH} | MEDIUM ${severity.MEDIUM} | LOW ${severity.LOW}`
  ];

  const topFindings = allFindings.slice(0, 5);
  if (topFindings.length > 0) {
    lines.push('', 'Top findings:');
    for (const finding of topFindings) {
      const location =
        'file' in finding && finding.file
          ? finding.line
            ? `${finding.file}:${finding.line}`
            : finding.file
          : 'dependency';
      lines.push(`- [${finding.severity}] ${location}: ${finding.description}`);
    }
  }

  lines.push('', 'Tip: use --json for the full report or open Scout UI for interactive review.');
  return lines.join('\n');
};
