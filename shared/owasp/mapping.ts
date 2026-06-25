export type OwaspCategory = {
  id: string;
  name: string;
};

const CATEGORY_MAP: Record<string, OwaspCategory> = {
  XSS: { id: 'A03:2021', name: 'Injection' },
  CODE_INJECTION: { id: 'A03:2021', name: 'Injection' },
  AST_DATA_FLOW: { id: 'A03:2021', name: 'Injection' },
  SECRET: { id: 'A02:2021', name: 'Cryptographic Failures' },
  DEPENDENCY: { id: 'A06:2021', name: 'Vulnerable and Outdated Components' },
  DEPENDENCY_VULNERABILITY: { id: 'A06:2021', name: 'Vulnerable and Outdated Components' },
  DEPENDENCY_ANALYSIS: { id: 'A06:2021', name: 'Vulnerable and Outdated Components' },
  DEPENDENCY_AUDIT: { id: 'A06:2021', name: 'Vulnerable and Outdated Components' },
  SEMGREP_INTEGRATION: { id: 'A05:2021', name: 'Security Misconfiguration' },
  SEMGREP_PARSE: { id: 'A05:2021', name: 'Security Misconfiguration' },
  STATIC_SCAN: { id: 'A05:2021', name: 'Security Misconfiguration' }
};

const DESCRIPTION_RULES: Array<{ pattern: RegExp; owasp: OwaspCategory }> = [
  { pattern: /postMessage/i, owasp: { id: 'A05:2021', name: 'Security Misconfiguration' } },
  { pattern: /child_process|exec\(/i, owasp: { id: 'A03:2021', name: 'Injection' } },
  { pattern: /hardcoded secret|api[_ -]?key|token|password/i, owasp: { id: 'A02:2021', name: 'Cryptographic Failures' } }
];

export const mapCategoryToOwasp = (category: string): OwaspCategory | undefined => {
  if (category.startsWith('DEPENDENCY')) {
    return CATEGORY_MAP.DEPENDENCY;
  }

  return CATEGORY_MAP[category];
};

export const mapFindingToOwasp = (finding: {
  category: string;
  description?: string;
  risk?: string;
}): OwaspCategory | undefined => {
  const direct = mapCategoryToOwasp(finding.category);
  if (direct) {
    return direct;
  }

  const haystack = `${finding.description || ''} ${finding.risk || ''}`;
  for (const rule of DESCRIPTION_RULES) {
    if (rule.pattern.test(haystack)) {
      return rule.owasp;
    }
  }

  return undefined;
};

export const enrichFindingWithOwasp = <T extends { category: string; description?: string; risk?: string }>(
  finding: T
): T & { owasp?: OwaspCategory } => {
  const owasp = mapFindingToOwasp(finding);
  return owasp ? { ...finding, owasp } : finding;
};

export const enrichFindingsWithOwasp = <T extends { category: string; description?: string; risk?: string }>(
  findings: T[]
): Array<T & { owasp?: OwaspCategory }> => findings.map((finding) => enrichFindingWithOwasp(finding));
