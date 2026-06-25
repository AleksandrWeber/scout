import { analyzeAstDataFlow } from '../../analyzers/ast-analyzer';
import { analyzeSecurityPatterns } from '../../analyzers/security-analyzer';
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
};

export type CodeSecurityAgentResult = {
  id: 'code-security';
  name: string;
  status: 'success' | 'failed';
  durationMs: number;
  message?: string;
  codeFindings: TaggedFinding[];
  semgrep: {
    status: 'success' | 'failed' | 'unknown';
    message?: string;
    count: number;
  };
  ast: {
    filesScanned: number;
    parseErrors: number;
    count: number;
  };
};

export const runCodeSecurityAgent = async (projectPath: string): Promise<CodeSecurityAgentResult> => {
  const startedAt = Date.now();

  try {
    const [securityResult, astResult] = await Promise.all([
      analyzeSecurityPatterns(projectPath),
      analyzeAstDataFlow(projectPath)
    ]);

    return {
      id: 'code-security',
      name: SCOUT_AGENT_LABELS['code-security'].en,
      status: 'success',
      durationMs: Date.now() - startedAt,
      codeFindings: [...securityResult.findings, ...astResult.findings].map((finding) => ({
        ...finding,
        scoutAgent: 'code-security' as const
      })),
      semgrep: {
        status: securityResult.semgrepStatus,
        message: securityResult.semgrepMessage,
        count: securityResult.semgrepCount
      },
      ast: {
        filesScanned: astResult.filesScanned,
        parseErrors: astResult.parseErrors,
        count: astResult.findings.length
      }
    };
  } catch (error) {
    return {
      id: 'code-security',
      name: SCOUT_AGENT_LABELS['code-security'].en,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Code-security agent failed',
      codeFindings: [],
      semgrep: { status: 'failed', count: 0 },
      ast: { filesScanned: 0, parseErrors: 0, count: 0 }
    };
  }
};
