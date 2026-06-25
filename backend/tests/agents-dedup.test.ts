import { buildFindingFingerprint, deduplicateFindings } from '../../shared/agents';

describe('agent finding dedup', () => {
  it('removes duplicate findings with the same fingerprint', () => {
    const findings = deduplicateFindings([
      {
        category: 'XSS',
        file: 'src/app.ts',
        line: 10,
        description: 'Unsafe HTML injection'
      },
      {
        category: 'XSS',
        file: 'src/app.ts',
        line: 10,
        description: 'Unsafe HTML injection'
      },
      {
        category: 'SECRET',
        file: 'src/config.ts',
        description: 'Hardcoded API key'
      }
    ]);

    expect(findings).toHaveLength(2);
    expect(buildFindingFingerprint(findings[0])).not.toBe(buildFindingFingerprint(findings[1]));
  });
});
