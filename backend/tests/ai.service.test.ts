describe('generateAiExplanation', () => {
  const savedEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER
  };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = 'auto';
  });

  afterAll(() => {
    if (savedEnv.GEMINI_API_KEY === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = savedEnv.GEMINI_API_KEY;
    }

    if (savedEnv.OPENAI_API_KEY === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = savedEnv.OPENAI_API_KEY;
    }

    if (savedEnv.AI_PROVIDER === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = savedEnv.AI_PROVIDER;
    }
  });

  it('returns a local explanation when no external AI key is configured', async () => {
    const { generateAiExplanation } = await import('../src/services/ai.service');

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

  it('caches repeated AI explanation requests for identical findings', async () => {
    const { generateAiExplanation } = await import('../src/services/ai.service');

    const finding = {
      severity: 'MEDIUM',
      category: 'Injection',
      file: 'src/app.js',
      description: 'Unescaped command string is passed to shell.',
      risk: 'Command injection may occur.',
      fix: 'Sanitize shell inputs.',
      education: 'Avoid direct shell execution with untrusted input.'
    };

    const first = await generateAiExplanation(finding);
    const second = await generateAiExplanation(finding);

    expect(second).toBe(first);
    expect(second.summary).toContain('Unescaped command string');
  });
});
