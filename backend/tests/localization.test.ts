import { localizeFinding } from '../../shared/localization';

describe('finding localization', () => {
  const finding = {
    severity: 'HIGH' as const,
    category: 'XSS',
    file: 'src/js/render-functions.js',
    line: 57,
    description: 'Assigns directly to innerHTML.',
    risk: 'Direct innerHTML assignment can execute malicious HTML or script content from untrusted sources.',
    fix: 'Use textContent, DOM APIs, or sanitize content before setting innerHTML.',
    education: 'innerHTML writes raw HTML into the DOM and does not escape user input automatically.',
    aiExplanation: {
      severity: 'HIGH' as const,
      summary: 'XSS in src/js/render-functions.js at line 57: Assigns directly to innerHTML.',
      risk: 'An attacker could inject scripts through src/js/render-functions.js.',
      suggestedFix: 'Use textContent, DOM APIs, or sanitize content before setting innerHTML.',
      codeSample: '<div>{escape(userInput)}</div>',
      beginnerExplanation: 'Writing to innerHTML tells the browser to treat a string as real webpage markup.'
    }
  };

  it('translates scanner and AI fields for Ukrainian locale', () => {
    const localized = localizeFinding(finding, 'uk');

    expect(localized.description).toBe('Пряме присвоєння innerHTML.');
    expect(localized.risk).toContain('innerHTML');
    expect(localized.aiExplanation?.summary).toContain('рядок 57');
    expect(localized.aiExplanation?.beginnerExplanation).toContain('innerHTML');
    expect(localized.aiExplanation?.beginnerExplanation).toMatch(/браузер/i);
  });

  it('keeps English content unchanged for English locale', () => {
    const localized = localizeFinding(finding, 'en');
    expect(localized.description).toBe(finding.description);
    expect(localized.aiExplanation?.summary).toBe(finding.aiExplanation.summary);
  });
});
