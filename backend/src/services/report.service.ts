import path from 'path';
import { normalizeLocale, AppLocale } from '../../../shared/localization';
import { enrichFindingsWithOwasp } from '../../../shared/owasp';
import { getProjectNameFromRepoUrl } from '../../../shared/reports';
import { generateAiExplanation } from './ai.service';
import { runMultiAgentScan } from './multi-agent-orchestrator.service';
import { getProjectNameFromPath, resolveLocalProjectPath } from './local-project.service';
import { prepareRepository } from './repository.service';

export type AnalysisSource = 'github' | 'local' | 'pullRequest';

export type AnalyzeProjectOptions = {
  locale?: unknown;
  includeAi?: boolean;
  source: AnalysisSource;
  displayUrl: string;
  projectPath: string;
  projectName: string;
};

const attachAiExplanations = async <T extends Record<string, unknown>>(
  findings: T[],
  locale: AppLocale
) =>
  Promise.all(
    findings.map(async (finding) => ({
      ...finding,
      aiExplanation: await generateAiExplanation(finding, locale)
    }))
  );

const enrichFindings = async <T extends Record<string, unknown>>(
  findings: T[],
  locale: AppLocale,
  includeAi: boolean
) => (includeAi ? attachAiExplanations(findings, locale) : findings);

export const analyzeProjectAtPath = async (projectPath: string, options: AnalyzeProjectOptions) => {
  const locale = normalizeLocale(options.locale);
  const includeAi = options.includeAi !== false;

  const scan = await runMultiAgentScan(projectPath, {
    locale,
    includeSynthesis: includeAi
  });

  const [codeFindingsWithAi, dependencyFindingsWithAi] = await Promise.all([
    enrichFindings(scan.codeFindings, locale, includeAi),
    enrichFindings(scan.dependencyFindings, locale, includeAi)
  ]);

  return {
    source: options.source,
    repoUrl: options.displayUrl,
    projectPath: options.source === 'local' ? options.projectPath : undefined,
    projectName: options.projectName,
    locale,
    agentsReview: scan.agentsReview,
    summary: {
      total: codeFindingsWithAi.length + dependencyFindingsWithAi.length,
      codeFindings: codeFindingsWithAi.length,
      dependencyFindings: dependencyFindingsWithAi.length,
      securityFindings: scan.summary.securityFindings,
      astFindings: scan.summary.astFindings,
      secretFindings: scan.summary.secretFindings
    },
    secrets: {
      filesScanned: scan.secrets.filesScanned,
      count: scan.secrets.count
    },
    ast: {
      filesScanned: scan.ast.filesScanned,
      parseErrors: scan.ast.parseErrors,
      count: scan.ast.count
    },
    semgrep: {
      status: scan.semgrep.status,
      message: scan.semgrep.message,
      count: scan.semgrep.count
    },
    findings: enrichFindingsWithOwasp(codeFindingsWithAi),
    dependencyFindings: enrichFindingsWithOwasp(dependencyFindingsWithAi)
  };
};

export const analyzeRepository = async (repoUrl: string, localeInput?: unknown) => {
  const sanitizedUrl = repoUrl.trim();
  const repoPath = await prepareRepository(sanitizedUrl);

  return analyzeProjectAtPath(repoPath, {
    locale: localeInput,
    source: 'github',
    displayUrl: sanitizedUrl,
    projectPath: repoPath,
    projectName: getProjectNameFromRepoUrl(sanitizedUrl)
  });
};

export const analyzeLocalProject = async (
  inputPath: string,
  options: { locale?: unknown; includeAi?: boolean } = {}
) => {
  const projectPath = await resolveLocalProjectPath(inputPath);

  return analyzeProjectAtPath(projectPath, {
    locale: options.locale,
    includeAi: options.includeAi,
    source: 'local',
    displayUrl: pathToFileUrl(projectPath),
    projectPath,
    projectName: getProjectNameFromPath(projectPath)
  });
};

const pathToFileUrl = (projectPath: string): string => {
  const normalized = projectPath.split(path.sep).join('/');
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
};
