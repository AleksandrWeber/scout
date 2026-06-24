import { normalizeSeverity } from '../utils/severity';

export type DependencyDetails = {
  packageName: string;
  advisoryId?: string;
  cveIds: string[];
  vulnerableVersions?: string;
  patchedVersion?: string;
  exploitAvailable: boolean;
  priorityScore: number;
};

export type DependencyFinding = {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  file: string;
  description: string;
  risk: string;
  fix: string;
  education: string;
  dependency?: DependencyDetails;
};

export const computeDependencyPriorityScore = (
  severity: 'HIGH' | 'MEDIUM' | 'LOW',
  exploitAvailable: boolean,
  cvssScore?: number
) => {
  const severityBase = severity === 'HIGH' ? 300 : severity === 'MEDIUM' ? 200 : 100;
  const exploitBonus = exploitAvailable ? 50 : 0;
  const cvssBonus = typeof cvssScore === 'number' ? Math.round(cvssScore * 10) : 0;
  return severityBase + exploitBonus + cvssBonus;
};

export const mapAdvisoryRecord = (
  packageName: string,
  advisory: Record<string, unknown>,
  options?: {
    vulnerableVersions?: string;
    patchedVersion?: string;
  }
): DependencyFinding => {
  const moduleName = (advisory.module_name as string) || (advisory.name as string) || packageName;
  const severity = normalizeSeverity((advisory.severity as string) || 'medium');
  const cveIds = Array.isArray(advisory.cves) ? (advisory.cves as string[]) : [];
  const cvssScore =
    typeof advisory.cvss === 'object' && advisory.cvss !== null
      ? (advisory.cvss as { score?: number }).score
      : undefined;
  const exploitAvailable = typeof cvssScore === 'number' && cvssScore >= 7;
  const patchedVersion =
    options?.patchedVersion ||
    (Array.isArray(advisory.patched_versions) ? (advisory.patched_versions as string[])[0] : undefined);

  return {
    severity,
    category: 'DEPENDENCY_VULNERABILITY',
    file: 'package.json',
    description: `${moduleName}: ${(advisory.title as string) || (advisory.overview as string) || 'has a known vulnerability.'}`,
    risk: (advisory.overview as string) || (advisory.title as string) || 'A dependency contains a public vulnerability.',
    fix:
      (advisory.recommendation as string) ||
      (patchedVersion
        ? `Update ${moduleName} to ${patchedVersion} or later.`
        : `Update ${moduleName} to a secure version.`),
    education: 'npm audit found a known vulnerability in a dependency defined by package.json.',
    dependency: {
      packageName: moduleName,
      advisoryId: advisory.id !== undefined ? String(advisory.id) : undefined,
      cveIds,
      vulnerableVersions:
        options?.vulnerableVersions ||
        (Array.isArray(advisory.vulnerable_versions)
          ? (advisory.vulnerable_versions as string[]).join(', ')
          : undefined),
      patchedVersion,
      exploitAvailable,
      priorityScore: computeDependencyPriorityScore(severity, exploitAvailable, cvssScore)
    }
  };
};

export const mapVulnerabilityRecord = (
  packageName: string,
  vulnerability: Record<string, unknown>,
  advisoriesIndex: Record<string, Record<string, unknown>>
): DependencyFinding => {
  const via = Array.isArray(vulnerability.via) ? vulnerability.via : [];
  const embeddedAdvisory = via.find(
    (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && 'title' in entry
  );
  const advisoryIdEntry = via.find((entry): entry is number => typeof entry === 'number');
  const advisoryFromIndex = advisoryIdEntry !== undefined ? advisoriesIndex[String(advisoryIdEntry)] : undefined;
  const advisory = embeddedAdvisory || advisoryFromIndex || {};

  const patchedVersion =
    typeof vulnerability.fixAvailable === 'object' && vulnerability.fixAvailable !== null
      ? (vulnerability.fixAvailable as { version?: string }).version
      : undefined;

  return mapAdvisoryRecord(packageName, advisory, {
    vulnerableVersions: (vulnerability.range as string) || undefined,
    patchedVersion
  });
};

export const mapAuditFindings = (auditJson: Record<string, unknown>): DependencyFinding[] => {
  const findings: DependencyFinding[] = [];
  const advisoriesIndex =
    auditJson.advisories && typeof auditJson.advisories === 'object'
      ? (auditJson.advisories as Record<string, Record<string, unknown>>)
      : {};

  if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === 'object') {
    for (const [packageName, vulnerability] of Object.entries(
      auditJson.vulnerabilities as Record<string, Record<string, unknown>>
    )) {
      if (!vulnerability || typeof vulnerability !== 'object') {
        continue;
      }

      findings.push(mapVulnerabilityRecord(packageName, vulnerability, advisoriesIndex));
    }

    if (findings.length > 0) {
      return findings;
    }
  }

  const advisories = auditJson.advisories || auditJson.vulnerabilities || {};

  if (Array.isArray(advisories)) {
    for (const advisory of advisories) {
      if (advisory && typeof advisory === 'object') {
        const record = advisory as Record<string, unknown>;
        findings.push(
          mapAdvisoryRecord(
            (record.module_name as string) || (record.name as string) || 'dependency',
            record
          )
        );
      }
    }
    return findings;
  }

  for (const advisoryId of Object.keys(advisories as Record<string, unknown>)) {
    const advisory = (advisories as Record<string, Record<string, unknown>>)[advisoryId];
    if (!advisory || typeof advisory !== 'object') {
      continue;
    }

    findings.push(
      mapAdvisoryRecord(
        (advisory.module_name as string) || (advisory.name as string) || 'dependency',
        advisory
      )
    );
  }

  return findings;
};
