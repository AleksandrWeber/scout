export type FindingSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

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
}

export type SemgrepStatusType = 'success' | 'failed' | 'unknown';

export type AnalysisSource = 'github' | 'local';

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
  summary: {
    total: number;
    codeFindings: number;
    dependencyFindings: number;
    securityFindings: number;
    astFindings?: number;
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
