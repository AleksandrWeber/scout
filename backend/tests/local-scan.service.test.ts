import path from 'path';
import { analyzeLocalProject } from '../src/services/report.service';

describe('analyzeLocalProject', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/sample-repo');

  it('scans a local project without AI explanations', async () => {
    const report = await analyzeLocalProject(fixturePath, { includeAi: false, locale: 'en' });

    expect(report.source).toBe('local');
    expect(report.projectPath).toBe(fixturePath);
    expect(report.projectName).toBe('sample-repo');
    expect(report.repoUrl).toContain('file://');
    expect(report.summary.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(report.findings)).toBe(true);
    expect(Array.isArray(report.dependencyFindings)).toBe(true);
  }, 60_000);
});
