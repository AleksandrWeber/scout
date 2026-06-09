import { generateAiExplanation } from '../src/services/ai.service';

describe('generateAiExplanation', () => {
  it('returns a local explanation when no external AI key is configured', async () => {
    const finding = {
      severity: 'HIGH',
      category: 'XSS',
      file: 'src/index.js',
      description: 'Unsanitized user input is rendered.',
      risk: 'User input can execute script code.',
      fix: 'Escape output and validate input.',
      education: 'XSS occurs when untrusted data is rendered without escaping.'
    };

    const result = await generateAiExplanation(finding);

    expect(result.severity).toBe('HIGH');
    expect(result.summary).toContain('XSS');
    expect(result.risk).toBe('User input can execute script code.');
    expect(result.suggestedFix).toBe('Escape output and validate input.');
    expect(result.beginnerExplanation).toContain('potential security problem');
  });
});
