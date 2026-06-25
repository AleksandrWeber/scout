import type { AppLocale } from '../localization';
import type { AnalysisReport, Finding, SemgrepStatus } from '../types';

export type ReportKind = 'technical' | 'executive';

export interface ReportMeta {
  projectName: string;
  repoUrl: string;
  scannedAt: string;
  locale: AppLocale;
  reportKind: ReportKind;
}

export interface ExecutiveNarrative {
  overview: string;
  priorities: string[];
  nextSteps: string[];
}

export interface ReportBuildInput {
  projectName: string;
  repoUrl: string;
  scannedAt: string;
  locale: AppLocale;
  findings: Finding[];
  dependencyFindings: Finding[];
  summary: AnalysisReport['summary'];
  semgrep?: SemgrepStatus;
  executiveNarrative?: ExecutiveNarrative;
}

export interface GeneratedReport {
  kind: ReportKind;
  title: string;
  html: string;
  plainText: string;
  fileName: string;
}
