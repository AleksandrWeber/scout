import { analyzeDependencies } from '../../analyzers/dependency-analyzer';
import { analyzeSecrets } from '../../analyzers/secrets-analyzer';
import { SCOUT_AGENT_LABELS } from '../../../../shared/agents';
import type { ScoutAgentId } from '../../../../shared/agents';

export type TaggedFinding = {
  scoutAgent: Exclude<ScoutAgentId, 'synthesis'>;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  file: string;
  line?: number;
  description: string;
  risk: string;
  fix: string;
  education: string;
  dependency?: {
    packageName: string;
    advisoryId?: string;
    cveIds: string[];
    vulnerableVersions?: string;
    patchedVersion?: string;
    exploitAvailable: boolean;
    priorityScore: number;
  };
};

export type SupplyChainAgentResult = {
  id: 'supply-chain';
  name: string;
  status: 'success' | 'failed';
  durationMs: number;
  message?: string;
  dependencyFindings: TaggedFinding[];
  codeFindings: TaggedFinding[];
  secrets: {
    filesScanned: number;
    count: number;
  };
};

export const runSupplyChainAgent = async (projectPath: string): Promise<SupplyChainAgentResult> => {
  const startedAt = Date.now();

  try {
    const [dependencyFindings, secretsResult] = await Promise.all([
      analyzeDependencies(projectPath),
      analyzeSecrets(projectPath)
    ]);

    return {
      id: 'supply-chain',
      name: SCOUT_AGENT_LABELS['supply-chain'].en,
      status: 'success',
      durationMs: Date.now() - startedAt,
      dependencyFindings: dependencyFindings.map((finding) => ({
        ...finding,
        scoutAgent: 'supply-chain' as const
      })),
      codeFindings: secretsResult.findings.map((finding) => ({
        ...finding,
        scoutAgent: 'supply-chain' as const
      })),
      secrets: {
        filesScanned: secretsResult.filesScanned,
        count: secretsResult.findings.length
      }
    };
  } catch (error) {
    return {
      id: 'supply-chain',
      name: SCOUT_AGENT_LABELS['supply-chain'].en,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Supply-chain agent failed',
      dependencyFindings: [],
      codeFindings: [],
      secrets: { filesScanned: 0, count: 0 }
    };
  }
};
