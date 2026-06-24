import { Finding, FindingSeverity } from '../types';
import { normalizeSeverity, SEVERITY_ORDER } from '../constants/severity';

export type DependencyPackageGroup = {
  packageName: string;
  findings: Finding[];
  highestSeverity: FindingSeverity;
  priorityScore: number;
  exploitAvailable: boolean;
};

export const isDependencyFinding = (finding: Finding) => finding.category.startsWith('DEPENDENCY');

const severityRank = (severity: FindingSeverity) => SEVERITY_ORDER.indexOf(severity);

export const getDependencyPackageName = (finding: Finding) =>
  finding.dependency?.packageName || finding.description.split(':')[0].trim() || 'unknown-package';

export const groupDependencyFindingsByPackage = (findings: Finding[]): DependencyPackageGroup[] => {
  const groups = new Map<string, Finding[]>();

  for (const finding of findings) {
    const packageName = getDependencyPackageName(finding);
    const bucket = groups.get(packageName) || [];
    bucket.push(finding);
    groups.set(packageName, bucket);
  }

  return [...groups.entries()]
    .map(([packageName, packageFindings]) => {
      const highestSeverity = packageFindings
        .map((finding) => normalizeSeverity(finding.severity))
        .sort((a, b) => severityRank(a) - severityRank(b))[0];

      const priorityScore = Math.max(...packageFindings.map((finding) => finding.dependency?.priorityScore ?? 0));
      const exploitAvailable = packageFindings.some((finding) => finding.dependency?.exploitAvailable);

      return {
        packageName,
        findings: packageFindings.sort(
          (a, b) => (b.dependency?.priorityScore ?? 0) - (a.dependency?.priorityScore ?? 0)
        ),
        highestSeverity,
        priorityScore,
        exploitAvailable
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.packageName.localeCompare(b.packageName));
};

export const formatCveList = (cveIds: string[]) => (cveIds.length > 0 ? cveIds.join(', ') : 'No CVE listed');
