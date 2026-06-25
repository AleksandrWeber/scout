import path from 'path';
import { normalizeLocale, AppLocale } from '../../../shared/localization';
import { enrichFindingsWithOwasp } from '../../../shared/owasp';
import { getProjectNameFromRepoUrl } from '../../../shared/reports';
import { generateAiExplanation } from './ai.service';
import { analyzeAstDataFlow } from '../analyzers/ast-analyzer';
import { analyzeDependencies } from '../analyzers/dependency-analyzer';
import { analyzeSecrets } from '../analyzers/secrets-analyzer';
import { analyzeSecurityPatterns } from '../analyzers/security-analyzer';
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

  const dependencyFindings = await analyzeDependencies(projectPath);
  const securityResult = await analyzeSecurityPatterns(projectPath);
  const astResult = await analyzeAstDataFlow(projectPath);
  const secretsResult = await analyzeSecrets(projectPath);

  const codeFindings = [
    ...securityResult.findings,
    ...astResult.findings,
    ...secretsResult.findings
  ];
  const [codeFindingsWithAi, dependencyFindingsWithAi] = await Promise.all([
    enrichFindings(codeFindings, locale, includeAi),
    enrichFindings(dependencyFindings, locale, includeAi)
  ]);

  return {
    source: options.source,
    repoUrl: options.displayUrl,
    projectPath: options.source === 'local' ? options.projectPath : undefined,
    projectName: options.projectName,
    locale,
    summary: {
      total: codeFindingsWithAi.length + dependencyFindingsWithAi.length,
      codeFindings: codeFindingsWithAi.length,
      dependencyFindings: dependencyFindingsWithAi.length,
      securityFindings: securityResult.findings.length,
      astFindings: astResult.findings.length,
      secretFindings: secretsResult.findings.length
    },
    secrets: {
      filesScanned: secretsResult.filesScanned,
      count: secretsResult.findings.length
    },
    ast: {
      filesScanned: astResult.filesScanned,
      parseErrors: astResult.parseErrors,
      count: astResult.findings.length
    },
    semgrep: {
      status: securityResult.semgrepStatus,
      message: securityResult.semgrepMessage,
      count: securityResult.semgrepCount
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
