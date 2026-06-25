import { describe, expect, it } from 'vitest';
import {
  buildExecutiveReport,
  buildTechnicalReport,
  formatScanTimestamp,
  getProjectNameFromRepoUrl
} from '@shared/reports';
import type { ReportBuildInput } from '@shared/reports';

const baseInput: ReportBuildInput = {
  projectName: 'acme/web-app',
  repoUrl: 'https://github.com/acme/web-app',
  scannedAt: '2026-06-10T14:30:00.000Z',
  locale: 'en',
  summary: {
    total: 2,
    codeFindings: 1,
    dependencyFindings: 1,
    securityFindings: 2
  },
  findings: [
    {
      severity: 'HIGH',
      category: 'XSS',
      file: 'src/App.tsx',
      line: 12,
      description: 'User input reaches innerHTML',
      risk: 'Script injection risk',
      fix: 'Use textContent or sanitize',
      education: 'XSS basics'
    }
  ],
  dependencyFindings: [
    {
      severity: 'MEDIUM',
      category: 'DEPENDENCY',
      file: 'package.json',
      description: 'Vulnerable dependency lodash',
      risk: 'Known CVE in dependency',
      fix: 'Upgrade lodash',
      education: 'Keep dependencies updated',
      dependency: {
        packageName: 'lodash',
        cveIds: ['CVE-2021-23337'],
        vulnerableVersions: '<4.17.21',
        patchedVersion: '4.17.21',
        exploitAvailable: true,
        priorityScore: 82
      }
    }
  ],
  semgrep: {
    status: 'success',
    count: 1
  }
};

describe('report builders', () => {
  it('extracts project name from GitHub URL', () => {
    expect(getProjectNameFromRepoUrl('https://github.com/acme/web-app')).toBe('acme/web-app');
  });

  it('formats scan timestamp for locale', () => {
    expect(formatScanTimestamp(baseInput.scannedAt, 'en')).toContain('2026');
    expect(formatScanTimestamp(baseInput.scannedAt, 'uk')).toContain('2026');
  });

  it('builds technical report with project and scan metadata', () => {
    const report = buildTechnicalReport(baseInput);

    expect(report.kind).toBe('technical');
    expect(report.html).toContain('acme/web-app');
    expect(report.html).toContain('https://github.com/acme/web-app');
    expect(report.html).toContain('src/App.tsx');
    expect(report.html).toContain('CVE-2021-23337');
    expect(report.plainText).toContain('acme/web-app');
  });

  it('builds executive report in plain language', () => {
    const report = buildExecutiveReport(baseInput);

    expect(report.kind).toBe('executive');
    expect(report.html).toContain('acme/web-app');
    expect(report.html).toContain('Top priorities');
    expect(report.html).toContain('Recommended next steps');
    expect(report.plainText).toContain('Critical issues were found');
  });
});
