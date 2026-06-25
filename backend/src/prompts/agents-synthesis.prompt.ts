import type { AppLocale } from '../../../shared/localization';
import type { AgentRunSummary } from '../../../shared/agents';

export const AGENTS_SYNTHESIS_PROMPT_VERSION = 'v1-multi-agent';

const localeInstruction = (locale: AppLocale) =>
  locale === 'uk'
    ? 'Write in natural Ukrainian for developers and security reviewers.'
    : 'Write in clear English for developers and security reviewers.';

export const buildAgentsSynthesisPrompt = (input: {
  locale: AppLocale;
  agentRuns: AgentRunSummary[];
  codeFindings: Array<{
    severity: string;
    category: string;
    file: string;
    description: string;
    scoutAgent?: string;
  }>;
  dependencyFindings: Array<{
    severity: string;
    category: string;
    file: string;
    description: string;
    scoutAgent?: string;
  }>;
}): string => {
  const payload = {
    agentRuns: input.agentRuns,
    codeFindings: input.codeFindings.slice(0, 10),
    dependencyFindings: input.dependencyFindings.slice(0, 10)
  };

  return `You are the synthesis agent in Scout, a hybrid AppSec assistant.
${localeInstruction(input.locale)}

Two deterministic agents already ran:
- supply-chain: secrets + dependency audit
- code-security: Semgrep + AST data-flow

Rules:
- Do NOT invent new vulnerabilities.
- Only summarize and prioritize findings already listed in the payload.
- Mention how the two agents complement each other.
- Keep priorities actionable and ordered by risk.

Return JSON only:
{
  "overview": "2-4 sentences",
  "priorities": ["top priority 1", "top priority 2", "top priority 3"],
  "consensusNote": "1-2 sentences on agent agreement / coverage"
}

Payload:
${JSON.stringify(payload, null, 2)}`;
};
