import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mapAuditFindings, type DependencyFinding } from './dependency-audit.mapper';

const execFileAsync = promisify(execFile);

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const analyzeDependencies = async (repoPath: string): Promise<DependencyFinding[]> => {
  const findings: DependencyFinding[] = [];
  const packageJsonPath = path.join(repoPath, 'package.json');

  if (!(await fileExists(packageJsonPath))) {
    return [
      {
        severity: 'LOW',
        category: 'DEPENDENCY_ANALYSIS',
        file: 'N/A',
        description: 'No package.json file was found in the repository.',
        risk: 'Without package metadata, dependency auditing cannot be performed.',
        fix: 'Add a package.json file or point Scout at a repository with Node.js dependencies.',
        education: 'Dependency analysis requires package metadata to identify installed packages and known vulnerabilities.'
      }
    ];
  }

  const packageLockPath = path.join(repoPath, 'package-lock.json');

  if (!(await fileExists(packageLockPath))) {
    try {
      await execFileAsync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit'], {
        cwd: repoPath,
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (error) {
      findings.push({
        severity: 'LOW',
        category: 'DEPENDENCY_ANALYSIS',
        file: 'package.json',
        description: 'Could not generate a package-lock file for audit.',
        risk: 'Without a lockfile, precise dependency vulnerability matching may be incomplete.',
        fix: 'Ensure npm is available and the repository contains valid package.json metadata.',
        education: 'npm audit uses lockfile metadata to inspect dependency graphs accurately.'
      });
    }
  }

  if (await fileExists(packageLockPath)) {
    try {
      const { stdout } = await execFileAsync('npm', ['audit', '--json'], {
        cwd: repoPath,
        maxBuffer: 10 * 1024 * 1024
      });
      const auditJson = JSON.parse(stdout);
      findings.push(...mapAuditFindings(auditJson));
    } catch (error: unknown) {
      const stdout = (error as any)?.stdout || '';

      if (stdout) {
        try {
          const auditJson = JSON.parse(stdout);
          findings.push(...mapAuditFindings(auditJson));
        } catch (parseError) {
          console.error('Failed to parse npm audit stdout as JSON', parseError);
          findings.push({
            severity: 'LOW',
            category: 'DEPENDENCY_AUDIT',
            file: 'package.json',
            description: 'npm audit output could not be parsed.',
            risk: 'Dependency vulnerabilities may still exist even if audit output was malformed.',
            fix: 'Verify npm availability and audit output in the backend environment.',
            education: 'npm audit requires valid JSON output to parse vulnerability findings.'
          });
        }
      } else {
        findings.push({
          severity: 'LOW',
          category: 'DEPENDENCY_AUDIT',
          file: 'package.json',
          description: 'npm audit could not complete in this repository.',
          risk: 'Dependency vulnerabilities may still exist even if the audit command failed.',
          fix: 'Verify npm availability and audit output in the backend environment.',
          education: 'npm audit requires network access and package metadata to report known vulnerabilities.'
        });
      }
    }
  }

  return findings.length > 0 ? findings : [
    {
      severity: 'LOW',
      category: 'DEPENDENCY_ANALYSIS',
      file: 'package.json',
      description: 'No dependency vulnerabilities were detected by npm audit.',
      risk: 'Dependency analysis completed without finding known advisories.',
      fix: 'Review package versions and update dependencies regularly to stay protected.',
      education: 'This result means audit did not report issues, but manual review is still valuable.'
    }
  ];
};

export type { DependencyDetails, DependencyFinding } from './dependency-audit.mapper';
