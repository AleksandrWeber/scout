export {
  SCOUT_AGENT_LABELS,
  type AgentRunStatus,
  type AgentRunSummary,
  type AgentsReviewMeta,
  type AgentsSynthesis,
  type ScoutAgentId
} from './types';

export { buildFindingFingerprint, deduplicateFindings, type DeduplicableFinding } from './dedup';
export { buildAgentsSynthesisFallback } from './synthesis-fallback';
