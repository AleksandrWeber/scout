import {
  computeDependencyPriorityScore,
  mapAdvisoryRecord,
  mapAuditFindings,
  mapVulnerabilityRecord
} from '../src/analyzers/dependency-audit.mapper';

describe('dependency-audit.mapper', () => {
  it('maps npm audit vulnerabilities format with package metadata', () => {
    const findings = mapAuditFindings({
      vulnerabilities: {
        lodash: {
          name: 'lodash',
          severity: 'high',
          range: '<4.17.21',
          via: [
            {
              source: 1523,
              name: 'lodash',
              title: 'Prototype Pollution',
              overview: 'Lodash versions before 4.17.21 are vulnerable to prototype pollution.',
              severity: 'high',
              cves: ['CVE-2021-23337'],
              cvss: { score: 7.4 }
            }
          ],
          fixAvailable: {
            name: 'lodash',
            version: '4.17.21'
          }
        }
      }
    });

    expect(findings).toHaveLength(1);
    expect(findings[0].dependency?.packageName).toBe('lodash');
    expect(findings[0].dependency?.cveIds).toEqual(['CVE-2021-23337']);
    expect(findings[0].dependency?.vulnerableVersions).toBe('<4.17.21');
    expect(findings[0].dependency?.patchedVersion).toBe('4.17.21');
    expect(findings[0].dependency?.exploitAvailable).toBe(true);
    expect(findings[0].dependency?.priorityScore).toBeGreaterThan(300);
  });

  it('maps legacy advisories format', () => {
    const findings = mapAuditFindings({
      advisories: {
        '1001': {
          id: 1001,
          module_name: 'minimist',
          severity: 'moderate',
          title: 'Prototype Pollution',
          overview: 'Prototype pollution in minimist.',
          cves: ['CVE-2020-7598'],
          vulnerable_versions: '<1.2.3',
          patched_versions: ['1.2.3']
        }
      }
    });

    expect(findings[0].dependency?.packageName).toBe('minimist');
    expect(findings[0].severity).toBe('MEDIUM');
    expect(findings[0].dependency?.patchedVersion).toBe('1.2.3');
  });

  it('computes priority score with severity and exploit bonus', () => {
    expect(computeDependencyPriorityScore('HIGH', true, 9)).toBeGreaterThan(
      computeDependencyPriorityScore('MEDIUM', false)
    );
  });

  it('maps vulnerability records using advisory index references', () => {
    const finding = mapVulnerabilityRecord(
      'axios',
      {
        name: 'axios',
        severity: 'high',
        range: '<0.21.2',
        via: [1103601]
      },
      {
        '1103601': {
          id: 1103601,
          module_name: 'axios',
          severity: 'high',
          title: 'Server-Side Request Forgery',
          overview: 'axios is vulnerable to SSRF.',
          cves: ['CVE-2021-3749'],
          cvss: { score: 7.5 }
        }
      }
    );

    expect(finding.dependency?.packageName).toBe('axios');
    expect(finding.dependency?.advisoryId).toBe('1103601');
    expect(finding.description).toContain('Server-Side Request Forgery');
  });
});
