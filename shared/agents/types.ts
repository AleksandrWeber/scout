export type ScoutAgentId = 'supply-chain' | 'code-security' | 'synthesis';

export type AgentRunStatus = 'success' | 'failed' | 'skipped';

export interface AgentRunSummary {
  id: ScoutAgentId;
  name: string;
  status: AgentRunStatus;
  findingsCount: number;
  durationMs: number;
  message?: string;
}

export interface AgentsSynthesis {
  overview: string;
  priorities: string[];
  consensusNote: string;
}

export interface AgentsReviewMeta {
  agents: AgentRunSummary[];
  synthesis?: AgentsSynthesis;
}

export const SCOUT_AGENT_LABELS: Record<Exclude<ScoutAgentId, 'synthesis'>, { en: string; uk: string }> = {
  'supply-chain': {
    en: 'Supply Chain',
    uk: 'Ланцюг постачання'
  },
  'code-security': {
    en: 'Code Security',
    uk: 'Безпека коду'
  }
};
