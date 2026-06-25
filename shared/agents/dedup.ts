export type DeduplicableFinding = {
  category: string;
  file: string;
  line?: number;
  description: string;
};

export const buildFindingFingerprint = (finding: DeduplicableFinding): string => {
  const line = finding.line != null ? String(finding.line) : '';
  const description = finding.description.trim().slice(0, 120).toLowerCase();
  return `${finding.category}|${finding.file}|${line}|${description}`;
};

export const deduplicateFindings = <T extends DeduplicableFinding>(findings: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const finding of findings) {
    const fingerprint = buildFindingFingerprint(finding);
    if (seen.has(fingerprint)) {
      continue;
    }

    seen.add(fingerprint);
    result.push(finding);
  }

  return result;
};
