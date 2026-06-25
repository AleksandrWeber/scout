import { deduplicateFindings, type AgentRunSummary, type AgentsReviewMeta } from '../../../shared/agents';
import type { AppLocale } from '../../../shared/localization';
import { runCodeSecurityAgent } from './agents/code-security.agent';
import { runSupplyChainAgent } from './agents/supply-chain.agent';
import { runSynthesisAgent } from './agents/synthesis.agent';

export type MultiAgentScanResult = {
  codeFindings: Array<
    Awaited<ReturnType<typeof runSupplyChainAgent>>['codeFindings'][number] |
      Awaited<ReturnType<typeof runCodeSecurityAgent>>['codeFindings'][number]
  >;
  dependencyFindings: Awaited<ReturnType<typeof runSupplyChainAgent>>['dependencyFindings'];
  agentsReview: AgentsReviewMeta;
  secrets: Awaited<ReturnType<typeof runSupplyChainAgent>>['secrets'];
  ast: Awaited<ReturnType<typeof runCodeSecurityAgent>>['ast'];
  semgrep: Awaited<ReturnType<typeof runCodeSecurityAgent>>['semgrep'];
  summary: {
    securityFindings: number;
    astFindings: number;
    secretFindings: number;
  };
};

const toAgentRunSummary = (
  agent:
    | Awaited<ReturnType<typeof runSupplyChainAgent>>
    | Awaited<ReturnType<typeof runCodeSecurityAgent>>
): AgentRunSummary => ({
  id: agent.id,
  name: agent.name,
  status: agent.status,
  findingsCount:
    agent.id === 'supply-chain'
      ? agent.codeFindings.length + agent.dependencyFindings.length
      : agent.codeFindings.length,
  durationMs: agent.durationMs,
  message: agent.message
});

export const runMultiAgentScan = async (
  projectPath: string,
  options: { locale: AppLocale; includeSynthesis: boolean }
): Promise<MultiAgentScanResult> => {
  const [supplyChain, codeSecurity] = await Promise.all([
    runSupplyChainAgent(projectPath),
    runCodeSecurityAgent(projectPath)
  ]);

  const codeFindings = deduplicateFindings([
    ...supplyChain.codeFindings,
    ...codeSecurity.codeFindings
  ]);

  const dependencyFindings = supplyChain.dependencyFindings;
  const agentRuns: AgentRunSummary[] = [
    toAgentRunSummary(supplyChain),
    toAgentRunSummary(codeSecurity)
  ];

  let synthesis = undefined;

  if (options.includeSynthesis) {
    const synthesisResult = await runSynthesisAgent({
      locale: options.locale,
      agentRuns,
      codeFindings,
      dependencyFindings
    });

    agentRuns.push({
      id: 'synthesis',
      name: 'Synthesis',
      status: 'success',
      findingsCount: 0,
      durationMs: synthesisResult.durationMs
    });
    synthesis = synthesisResult.synthesis;
  }

  const securityFindings = codeSecurity.codeFindings.filter(
    (finding) => finding.category !== 'AST_DATA_FLOW'
  ).length;

  return {
    codeFindings,
    dependencyFindings,
    agentsReview: { agents: agentRuns, synthesis },
    secrets: supplyChain.secrets,
    ast: codeSecurity.ast,
    semgrep: codeSecurity.semgrep,
    summary: {
      securityFindings,
      astFindings: codeSecurity.ast.count,
      secretFindings: supplyChain.secrets.count
    }
  };
};
