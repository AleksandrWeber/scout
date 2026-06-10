import { Finding, FindingSeverity } from '../types';
import { SEVERITY_ORDER } from '../constants/severity';

export type GroupByOption = 'none' | 'severity' | 'category' | 'file';

export type FindingsFilters = {
  search: string;
  severity: FindingSeverity | 'ALL';
  category: string | 'ALL';
  groupBy: GroupByOption;
};

export const defaultFindingsFilters = (): FindingsFilters => ({
  search: '',
  severity: 'ALL',
  category: 'ALL',
  groupBy: 'severity'
});

const severityOrder: FindingSeverity[] = SEVERITY_ORDER;

const severityRank = (severity: FindingSeverity) => severityOrder.indexOf(severity);

export const sortFindingsBySeverity = (findings: Finding[]): Finding[] =>
  [...findings].sort((a, b) => {
    const bySeverity = severityRank(a.severity) - severityRank(b.severity);
    if (bySeverity !== 0) {
      return bySeverity;
    }

    const byFile = a.file.localeCompare(b.file);
    if (byFile !== 0) {
      return byFile;
    }

    return (a.line ?? Number.MAX_SAFE_INTEGER) - (b.line ?? Number.MAX_SAFE_INTEGER);
  });

export const getUniqueCategories = (findings: Finding[]): string[] => {
  return [...new Set(findings.map((finding) => finding.category))].sort((a, b) => a.localeCompare(b));
};

export const filterFindings = (findings: Finding[], filters: FindingsFilters): Finding[] => {
  const search = filters.search.trim().toLowerCase();

  return sortFindingsBySeverity(
    findings.filter((finding) => {
      if (filters.severity !== 'ALL' && finding.severity !== filters.severity) {
        return false;
      }

      if (filters.category !== 'ALL' && finding.category !== filters.category) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        finding.category,
        finding.file,
        finding.line?.toString(),
        finding.description,
        finding.risk,
        finding.fix,
        finding.education,
        finding.aiExplanation?.summary,
        finding.aiExplanation?.beginnerExplanation
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    })
  );
};

export const groupFindings = (
  findings: Finding[],
  groupBy: GroupByOption
): Array<{ key: string; label: string; findings: Finding[] }> => {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All findings', findings: sortFindingsBySeverity(findings) }];
  }

  const groups = new Map<string, Finding[]>();

  for (const finding of findings) {
    const key =
      groupBy === 'severity'
        ? finding.severity
        : groupBy === 'category'
          ? finding.category
          : finding.file;

    const bucket = groups.get(key) || [];
    bucket.push(finding);
    groups.set(key, bucket);
  }

  const keys = [...groups.keys()];

  if (groupBy === 'severity') {
    keys.sort((a, b) => severityOrder.indexOf(a as FindingSeverity) - severityOrder.indexOf(b as FindingSeverity));
  } else {
    keys.sort((a, b) => a.localeCompare(b));
  }

  return keys.map((key) => ({
    key,
    label:
      groupBy === 'severity'
        ? `${key} severity`
        : groupBy === 'category'
          ? key
          : key,
    findings: sortFindingsBySeverity(groups.get(key) || [])
  }));
};

export const formatFindingLocation = (finding: Pick<Finding, 'file' | 'line'>) => {
  if (!finding.file || finding.file === 'N/A') {
    return 'Unknown location';
  }

  const fileName = finding.file.split('/').pop() || finding.file;
  if (finding.line) {
    return `${finding.file}:${finding.line} (${fileName})`;
  }

  return `${finding.file} (${fileName})`;
};

export const getFindingSummary = (finding: Finding) => {
  const text = finding.aiExplanation?.summary || finding.description;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
};

export const countBySeverity = (findings: Finding[]) =>
  findings.reduce(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    { HIGH: 0, MEDIUM: 0, LOW: 0 }
  );
