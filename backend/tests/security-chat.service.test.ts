import { buildLocalSecurityChatReply, generateSecurityChatReply } from '../src/services/security-chat.service';

describe('security-chat.service', () => {
  const finding = {
    category: 'XSS',
    file: 'src/App.tsx',
    line: 12,
    description: 'Uses dangerouslySetInnerHTML.',
    risk: 'User input can execute script code.',
    fix: 'Sanitize HTML before rendering.'
  };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = 'auto';
  });

  it('builds a local fix-oriented reply', () => {
    const reply = buildLocalSecurityChatReply(finding, 'How do I fix this?');
    expect(reply).toContain('src/App.tsx');
    expect(reply).toContain('Sanitize HTML');
  });

  it('returns a cached reply for identical chat requests', async () => {
    const first = await generateSecurityChatReply({
      finding,
      message: 'Why is this dangerous?'
    });
    const second = await generateSecurityChatReply({
      finding,
      message: 'Why is this dangerous?'
    });

    expect(second).toBe(first);
    expect(first.provider).toBe('local');
    expect(first.reply).toContain('XSS');
  });
});
