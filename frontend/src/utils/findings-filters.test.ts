import { describe, expect, it } from 'vitest';
import { Finding } from '../types';
import {
  defaultFindingsFilters,
  filterFindings,
  formatFindingLocation,
  getUniqueCategories,
  groupFindings,
  countBySeverity,
  sortFindingsBySeverity
} from './findings-filters';

const sampleFindings: Finding[] = [
  {
    severity: 'HIGH',
    category: 'XSS',
    file: 'src/App.tsx',
    line: 12,
    description: 'Unsanitized input is rendered.',
    risk: 'Script injection.',
    fix: 'Escape output.',
    education: 'Sanitize user content.'
  },
  {
    severity: 'MEDIUM',
    category: 'DEPENDENCY_VULNERABILITY',
    file: 'package.json',
    description: 'Vulnerable dependency detected.',
    risk: 'Known CVE.',
    fix: 'Upgrade dependency.',
    education: 'Keep dependencies updated.'
  },
  {
    severity: 'LOW',
    category: 'XSS',
    file: 'src/utils.ts',
    description: 'Potential unsafe pattern.',
    risk: 'Low risk issue.',
    fix: 'Review code.',
    education: 'Validate inputs.'
  }
];

describe('findings-filters', () => {
  it('filters findings by severity, category, and search text', () => {
    const filters = {
      ...defaultFindingsFilters(),
      severity: 'HIGH' as const,
      category: 'XSS',
      search: 'rendered'
    };

    const result = filterFindings(sampleFindings, filters);

    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('src/App.tsx');
  });

  it('groups findings by severity in priority order', () => {
    const groups = groupFindings(sampleFindings, 'severity');

    expect(groups.map((group) => group.key)).toEqual(['HIGH', 'MEDIUM', 'LOW']);
    expect(groups[0].findings[0].file).toBe('src/App.tsx');
  });

  it('sorts findings from high severity to low severity', () => {
    const sorted = sortFindingsBySeverity(sampleFindings);

    expect(sorted.map((finding) => finding.severity)).toEqual(['HIGH', 'MEDIUM', 'LOW']);
  });

  it('formats file path and line number for display', () => {
    expect(formatFindingLocation({ file: 'src/App.tsx', line: 42 })).toBe('src/App.tsx:42 (App.tsx)');
  });

  it('normalizes moderate severity into MEDIUM counts and groups', () => {
    const moderateFinding: Finding = {
      ...sampleFindings[1],
      severity: 'MODERATE' as Finding['severity']
    };

    expect(countBySeverity([moderateFinding]).MEDIUM).toBe(1);
    expect(groupFindings([moderateFinding], 'severity').map((group) => group.key)).toEqual(['MEDIUM']);
  });

  it('returns unique sorted categories', () => {
    expect(getUniqueCategories(sampleFindings)).toEqual(['DEPENDENCY_VULNERABILITY', 'XSS']);
  });
});
