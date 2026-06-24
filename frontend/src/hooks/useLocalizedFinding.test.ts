import { describe, expect, it } from 'vitest';
import { localizeFinding } from '@shared/localization';

describe('useLocalizedFinding integration', () => {
  it('localizes innerHTML XSS finding for Ukrainian display', () => {
    const localized = localizeFinding(
      {
        severity: 'HIGH',
        category: 'XSS',
        file: 'src/js/render-functions.js',
        line: 57,
        description: 'Assigns directly to innerHTML.',
        risk: 'Direct innerHTML assignment can execute malicious HTML or script content from untrusted sources.',
        fix: 'Use textContent, DOM APIs, or sanitize content before setting innerHTML.',
        education: 'innerHTML writes raw HTML into the DOM and does not escape user input automatically.'
      },
      'uk'
    );

    expect(localized.description).toBe('Пряме присвоєння innerHTML.');
    expect(localized.fix).toContain('textContent');
  });
});
