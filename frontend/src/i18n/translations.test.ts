import { describe, expect, it } from 'vitest';
import { getCategoryLabel } from './category-labels';
import { formatTranslation, translations } from './translations';

describe('translations', () => {
  it('uses natural Ukrainian for UI labels', () => {
    expect(translations.uk.codeFindingsTab).toBe('Знахідки в коді');
    expect(translations.uk.dependenciesTab).toBe('Залежності');
    expect(translations.uk.severity).toBe('Рівень загрози');
    expect(translations.uk.category).toBe('Категорія');
    expect(translations.uk.description).toBe('Опис:');
  });

  it('keeps product and standard names in Latin script', () => {
    expect(translations.uk.semgrepFindings).toContain('Semgrep');
    expect(translations.uk.cve).toBe('CVE:');
    expect(translations.uk.exploitLikely).toContain('exploit');
  });

  it('interpolates template values', () => {
    expect(formatTranslation('Showing {filtered} of {total}', { filtered: 2, total: 5 })).toBe(
      'Showing 2 of 5'
    );
  });
});

describe('category labels', () => {
  it('translates known categories for Ukrainian UI', () => {
    expect(getCategoryLabel('CODE_INJECTION', 'uk')).toBe("Ін'єкція коду");
    expect(getCategoryLabel('XSS', 'uk')).toBe('XSS');
  });

  it('humanizes unknown categories in English UI', () => {
    expect(getCategoryLabel('CUSTOM_RULE', 'en')).toBe('CUSTOM RULE');
  });
});
