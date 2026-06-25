import { enrichFindingsWithOwasp, mapCategoryToOwasp, mapFindingToOwasp } from '../../shared/owasp';

describe('OWASP mapping', () => {
  it('maps XSS findings to Injection', () => {
    expect(mapCategoryToOwasp('XSS')).toEqual({
      id: 'A03:2021',
      name: 'Injection'
    });
  });

  it('maps secrets to Cryptographic Failures', () => {
    expect(mapCategoryToOwasp('SECRET')).toEqual({
      id: 'A02:2021',
      name: 'Cryptographic Failures'
    });
  });

  it('maps dependency categories to Vulnerable Components', () => {
    expect(mapCategoryToOwasp('DEPENDENCY_VULNERABILITY')).toEqual({
      id: 'A06:2021',
      name: 'Vulnerable and Outdated Components'
    });
  });

  it('uses description heuristics when category is unknown', () => {
    expect(
      mapFindingToOwasp({
        category: 'CUSTOM',
        description: 'Insecure postMessage listener without origin check'
      })
    ).toEqual({
      id: 'A05:2021',
      name: 'Security Misconfiguration'
    });
  });

  it('enriches findings with OWASP metadata', () => {
    const enriched = enrichFindingsWithOwasp([
      {
        category: 'CODE_INJECTION',
        description: 'child_process.exec with user input'
      }
    ]);

    expect(enriched[0].owasp).toEqual({
      id: 'A03:2021',
      name: 'Injection'
    });
  });
});
