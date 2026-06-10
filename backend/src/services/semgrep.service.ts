import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import path from 'path';
import { VulnerabilityFinding } from '../analyzers/security-analyzer';
import { normalizeSeverity } from '../utils/severity';

const semgrepConfigPath = path.join(__dirname, '../../.semgrep.yml');

export type SemgrepResult = {
  findings: VulnerabilityFinding[];
  count: number;
  status: 'success' | 'failed';
  message?: string;
};

export const runSemgrep = async (repoPath: string): Promise<SemgrepResult> => {
  const execFileAsync = promisify(execFile);
  const sourceFiles = await collectSourceFiles(repoPath, repoPath);

  if (sourceFiles.length === 0) {
    return {
      findings: [],
      count: 0,
      status: 'success',
      message: 'No source files found for Semgrep scanning.'
    };
  }

  try {
    const res: any = await execFileAsync(
      'semgrep',
      ['--config', semgrepConfigPath, '--json', ...sourceFiles],
      {
        cwd: repoPath,
        maxBuffer: 20 * 1024 * 1024
      }
    );

    const stdout = typeof res === 'string' ? res : res?.stdout ?? (Array.isArray(res) ? res[0] : '');
    const findings = mapSemgrepOutput(stdout);

    return {
      findings,
      count: findings.length,
      status: 'success'
    };
  } catch (error: unknown) {
    const stdout = (error as any)?.stdout || '';

    if (stdout) {
      const findings = mapSemgrepOutput(stdout);
      return {
        findings,
        count: findings.length,
        status: 'success'
      };
    }

    const fallback = {
      findings: [
        {
          severity: 'LOW',
          category: 'SEMgrep_INTEGRATION',
          file: 'N/A',
          description: 'Semgrep integration could not run. Ensure semgrep CLI is installed.',
          risk: 'Security scan did not include Semgrep detections.',
          fix: 'Install Semgrep and retry analysis: https://semgrep.dev/docs/getting-started/',
          education: 'Semgrep CLI must be available on the backend host to execute pattern-based scans.'
        }
      ] as VulnerabilityFinding[],
      count: 0,
      status: 'failed' as const,
      message: 'Semgrep CLI could not be executed. Make sure semgrep is installed on the backend host.'
    };

    return fallback;
  }
};

const collectSourceFiles = async (directory: string, rootDir: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      files.push(...(await collectSourceFiles(fullPath, rootDir)));
      continue;
    }

    if (fullPath.match(/\.(js|jsx|ts|tsx)$/i)) {
      files.push(path.relative(rootDir, fullPath));
    }
  }

  return files;
};

const mapSemgrepOutput = (stdout: any): VulnerabilityFinding[] => {
  try {
    const text = typeof stdout === 'string' ? stdout : stdout?.toString?.() || '';
    const parsed = JSON.parse(text);
    const results = parsed.results || [];

    return results.map((result: any) => {
      const metadata = result.extra?.metadata || {};
      const severity = normalizeSeverity(metadata.severity || result.extra?.severity || 'LOW');
      return {
        severity,
        category: metadata.category || result.check_id || 'SEMgrep',
        file: result.path || 'unknown',
        line: result.start?.line,
        description: result.extra?.message || 'Semgrep detected a problem.',
        risk: metadata.risk || result.extra?.message || 'Potential security issue detected by Semgrep.',
        fix: metadata.fix || 'Review the Semgrep finding and apply a safe code pattern.',
        education: metadata.education || result.extra?.metadata?.education || 'Semgrep identified this pattern as a security risk.'
      };
    });
  } catch {
    return [
      {
        severity: 'LOW',
        category: 'SEMgrep_PARSE',
        file: 'N/A',
        description: 'Semgrep output could not be parsed.',
        risk: 'Semgrep results are unavailable for this analysis run.',
        fix: 'Verify that Semgrep returns valid JSON output and retry.',
        education: 'Semgrep CLI output must be valid JSON when using --json.'
      }
    ];
  }
};
