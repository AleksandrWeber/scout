export type FindingSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type SemgrepStatusType = 'success' | 'failed' | 'unknown';

export interface AiExplanation {
  severity: FindingSeverity;
  summary: string;
  risk: string;
  suggestedFix: string;
  codeSample?: string;
  beginnerExplanation?: string;
}

export interface Finding {
  severity: FindingSeverity;
  category: string;
  file: string;
  description: string;
  risk: string;
  fix: string;
  education: string;
  aiExplanation?: AiExplanation;
}

export interface SemgrepStatus {
  status: SemgrepStatusType;
  message?: string;
  count?: number;
}

export interface AnalysisReport {
  repoUrl: string;
  summary: {
    total: number;
    dependencyFindings: number;
    securityFindings: number;
  };
  semgrep?: SemgrepStatus;
  findings: Finding[];
}
