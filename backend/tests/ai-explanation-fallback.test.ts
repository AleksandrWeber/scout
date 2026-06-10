import {
  buildLocalBeginnerExplanation,
  finalizeAiExplanation,
  isGenericBeginnerExplanation
} from '../src/utils/ai-explanation-fallback';

describe('ai-explanation-fallback', () => {
  it('builds different beginner explanations per category', () => {
    const xss = buildLocalBeginnerExplanation({
      category: 'XSS',
      file: 'src/App.tsx',
      description: 'Uses dangerouslySetInnerHTML in a React component.'
    });
    const dependency = buildLocalBeginnerExplanation({
      category: 'DEPENDENCY_VULNERABILITY',
      file: 'package.json',
      description: 'lodash has a known vulnerability.'
    });

    expect(xss).toContain('dangerouslySetInnerHTML');
    expect(dependency).toContain('lodash');
    expect(xss).not.toBe(dependency);
    expect(isGenericBeginnerExplanation(xss)).toBe(false);
  });

  it('replaces generic AI beginner text with a contextual fallback', () => {
    const finding = {
      category: 'CODE_INJECTION',
      file: 'src/utils/run.js',
      line: 9,
      description: 'Calls eval() with dynamic input.',
      risk: 'eval() can execute attacker-controlled strings as code.',
      fix: 'Remove eval().'
    };

    const finalized = finalizeAiExplanation(finding, {
      severity: 'HIGH',
      summary: 'Dynamic eval usage detected.',
      risk: 'Remote code execution is possible.',
      suggestedFix: 'Replace eval with safe parsing.',
      codeSample: '// sanitize input before use',
      beginnerExplanation:
        'Think of this as a weak spot in how the app handles data or dependencies. Fixing it now is cheaper than dealing with an incident later.'
    });

    expect(finalized.beginnerExplanation).toContain('eval()');
    expect(finalized.beginnerExplanation).toContain('src/utils/run.js');
    expect(finalized.codeSample).toContain('parseUserInputSafely');
  });
});
