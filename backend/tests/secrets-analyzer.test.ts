import path from 'path';
import { analyzeSecrets } from '../src/analyzers/secrets-analyzer';

describe('secrets-analyzer', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/secrets-repo');

  it('detects likely secrets in local project files', async () => {
    const result = await analyzeSecrets(fixturePath);

    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.findings.some((finding) => finding.category === 'SECRET')).toBe(true);
    expect(result.findings.some((finding) => finding.secretType === 'aws-access-key')).toBe(true);
    expect(result.findings.some((finding) => finding.file.includes('config.js'))).toBe(true);
  });
});
