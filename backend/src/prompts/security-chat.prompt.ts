export const SECURITY_CHAT_PROMPT_VERSION = 'v3-rag';

export type SecurityChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export const buildSecurityChatPrompt = (
  finding: Record<string, unknown>,
  message: string,
  history: SecurityChatTurn[] = [],
  knowledgeContext = ''
) => {
  const historyText =
    history.length > 0
      ? history.map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`).join('\n')
      : 'No previous messages.';

  const knowledgeSection = knowledgeContext.trim()
    ? `Knowledge base excerpts (use as reference; do not invent facts beyond them):\n${knowledgeContext}\n`
    : '';

  return `You are a friendly AppSec mentor helping a developer understand one specific security finding.

Answer in clear, practical language. Stay focused on THIS finding only.
If the finding category is STATIC_SCAN, SEMgrep_INTEGRATION, or another informational note, explain that it is not a code vulnerability and what the user should do next (install Semgrep, scan a JS/TS repo, etc.).
If the user asks how to fix a real issue, give concrete steps for JavaScript/TypeScript/React/Node.js.
Do not repeat the scanner text word-for-word.
When knowledge base excerpts are provided, ground your answer in them.

${knowledgeSection}Finding context:
${JSON.stringify(finding, null, 2)}

Conversation so far:
${historyText}

User question:
${message}

Reply with plain text only (no JSON). Keep it concise: 2-5 sentences unless the user asks for a detailed walkthrough.`;
};
