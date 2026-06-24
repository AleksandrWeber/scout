import { buildLocalSecurityChatReply } from '../src/utils/security-chat-fallback';

describe('security-chat-fallback', () => {
  const staticScanFinding = {
    category: 'STATIC_SCAN',
    file: 'N/A',
    severity: 'LOW',
    description: 'No security patterns were detected by the initial scanner.',
    risk: 'A deeper analysis may still reveal more issues, especially in dynamic code paths.',
    fix: 'Integrate Semgrep or AST-based analysis to improve coverage.'
  };

  const xssFinding = {
    category: 'XSS',
    file: 'src/App.tsx',
    description: 'Uses dangerouslySetInnerHTML.',
    risk: 'User input can execute script code.',
    fix: 'Sanitize HTML before rendering.'
  };

  it('explains STATIC_SCAN is informational when asked why it is dangerous', () => {
    const reply = buildLocalSecurityChatReply(staticScanFinding, 'why is this dangerous?');
    expect(reply.toLowerCase()).toContain('not a vulnerability');
    expect(reply).not.toContain('untrusted input or unsafe APIs');
  });

  it('answers Ukrainian what-to-do for STATIC_SCAN without asking to fix N/A', () => {
    const reply = buildLocalSecurityChatReply(staticScanFinding, 'що робити');
    expect(reply.toLowerCase()).toContain('no code change');
    expect(reply).not.toContain('in N/A');
  });

  it('builds a concrete fix reply for real code findings', () => {
    const reply = buildLocalSecurityChatReply(xssFinding, 'How do I fix this?');
    expect(reply).toContain('src/App.tsx');
    expect(reply).toContain('Sanitize HTML');
  });
});
