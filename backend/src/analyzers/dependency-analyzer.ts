import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

export type DependencyFinding = {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  file: string;
  description: string;
  risk: string;
  fix: string;
  education: string;
};

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
    } catch (error) {
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

const mapAuditFindings = (auditJson: any): DependencyFinding[] => {
  const findings: DependencyFinding[] = [];
  const advisories = auditJson.advisories || auditJson.vulnerabilities || {};

  if (Array.isArray(advisories)) {
    for (const advisory of advisories) {
      findings.push(mapAdvisory(advisory));
    }
    return findings;
  }

  for (const advisoryId of Object.keys(advisories)) {
    const advisory = advisories[advisoryId];
    findings.push(mapAdvisory(advisory));
  }

  return findings;
};

const mapAdvisory = (advisory: any): DependencyFinding => {
  const moduleName = advisory.module_name || advisory.name || 'dependency';
  const severity = (advisory.severity || 'medium').toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';

  return {
    severity,
    category: 'DEPENDENCY_VULNERABILITY',
    file: 'package.json',
    description: `${moduleName} ${advisory.title || advisory.overview || 'has a known vulnerability.'}`,
    risk: advisory.overview || advisory.title || 'A dependency contains a public vulnerability.',
    fix: advisory.recommendation || `Update ${moduleName} to a secure version or apply the suggested patch.`,
    education: 'npm audit found a known vulnerability in a dependency defined by package.json.'
  };
};
