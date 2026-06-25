export type FindingSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type { AgentRunSummary, AgentsReviewMeta, AgentsSynthesis, ScoutAgentId } from '../agents/types';

export interface AiExplanation {
  severity: FindingSeverity;
  summary: string;
  risk: string;
  suggestedFix: string;
  codeSample?: string;
  beginnerExplanation?: string;
}

export interface DependencyDetails {
  packageName: string;
  advisoryId?: string;
  cveIds: string[];
  vulnerableVersions?: string;
  patchedVersion?: string;
  exploitAvailable: boolean;
  priorityScore: number;
}

export interface OwaspCategory {
  id: string;
  name: string;
}

export interface Finding {
  severity: FindingSeverity;
  category: string;
  file: string;
  line?: number;
  description: string;
  risk: string;
  fix: string;
  education: string;
  aiExplanation?: AiExplanation;
  dependency?: DependencyDetails;
  owasp?: OwaspCategory;
  scoutAgent?: 'supply-chain' | 'code-security';
}

export type SemgrepStatusType = 'success' | 'failed' | 'unknown';

export type AnalysisSource = 'github' | 'local' | 'pullRequest';

export interface PullRequestReviewMeta {
  pullNumber: number;
  title: string;
  htmlUrl: string;
  headSha: string;
  baseSha: string;
  changedFiles: number;
  analyzedFiles: number;
}

export interface SemgrepStatus {
  status: SemgrepStatusType;
  message?: string;
  count?: number;
}

export interface AnalysisReport {
  source?: AnalysisSource;
  repoUrl: string;
  projectPath?: string;
  projectName?: string;
  prReview?: PullRequestReviewMeta;
  agentsReview?: AgentsReviewMeta;
  summary: {
    total: number;
    codeFindings: number;
    dependencyFindings: number;
    securityFindings: number;
    astFindings?: number;
    secretFindings?: number;
  };
  secrets?: {
    filesScanned: number;
    count: number;
  };
  ast?: {
    filesScanned: number;
    parseErrors: number;
    count: number;
  };
  semgrep?: SemgrepStatus;
  findings: Finding[];
  dependencyFindings: Finding[];
}
