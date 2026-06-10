import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { analyzeDependencies } from '../src/analyzers/dependency-analyzer';
import { analyzeSecurityPatterns } from '../src/analyzers/security-analyzer';

const execFileAsync = promisify(execFile);
const fixtureRepo = path.join(__dirname, 'fixtures/sample-repo');

const copySampleRepo = async (): Promise<string> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-sample-'));
  await fs.cp(fixtureRepo, tempDir, { recursive: true });
  return tempDir;
};

const isSemgrepAvailable = async (): Promise<boolean> => {
  try {
    await execFileAsync('semgrep', ['--version']);
    return true;
  } catch {
    return false;
  }
};

describe('Backend integration: Semgrep and npm audit', () => {
  it('runs Semgrep and npm audit against a sample repository', async () => {
    const semgrepAvailable = await isSemgrepAvailable();
    if (!semgrepAvailable) {
      console.warn('Skipping Semgrep integration assertions: semgrep CLI is not installed.');
      return;
    }

    const repoPath = await copySampleRepo();

    const dependencyFindings = await analyzeDependencies(repoPath);
    const securityResult = await analyzeSecurityPatterns(repoPath);

    expect(securityResult.semgrepStatus).toBe('success');
    expect(securityResult.semgrepCount).toBeGreaterThan(0);
    expect(securityResult.findings.some((finding) => finding.category === 'XSS')).toBe(true);

    expect(dependencyFindings.length).toBeGreaterThan(0);
    expect(dependencyFindings.some((finding) => finding.category === 'DEPENDENCY_VULNERABILITY')).toBe(true);
  }, 120_000);
});
