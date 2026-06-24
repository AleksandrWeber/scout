export const SECURITY_CHAT_PROMPT_VERSION = 'v1';

export type SecurityChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export const buildSecurityChatPrompt = (
  finding: Record<string, unknown>,
  message: string,
  history: SecurityChatTurn[] = []
) => {
  const historyText =
    history.length > 0
      ? history.map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`).join('\n')
      : 'No previous messages.';

  return `You are a friendly AppSec mentor helping a developer understand one specific security finding.

Answer in clear, practical language. Stay focused on THIS finding only.
If the user asks how to fix it, give concrete steps for JavaScript/TypeScript/React/Node.js.
Do not repeat the scanner text word-for-word.

Finding context:
${JSON.stringify(finding, null, 2)}

Conversation so far:
${historyText}

User question:
${message}

Reply with plain text only (no JSON). Keep it concise: 2-5 sentences unless the user asks for a detailed walkthrough.`;
};
