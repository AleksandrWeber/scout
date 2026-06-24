import { normalizeLocale, AppLocale } from '../../../shared/localization';
import { generateAiExplanation } from './ai.service';
import { analyzeAstDataFlow } from '../analyzers/ast-analyzer';
import { analyzeDependencies } from '../analyzers/dependency-analyzer';
import { analyzeSecurityPatterns } from '../analyzers/security-analyzer';
import { prepareRepository } from '../services/repository.service';

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

export const analyzeRepository = async (repoUrl: string, localeInput?: unknown) => {
  const locale = normalizeLocale(localeInput);
  const sanitizedUrl = repoUrl.trim();
  const repoPath = await prepareRepository(sanitizedUrl);

  const dependencyFindings = await analyzeDependencies(repoPath);
  const securityResult = await analyzeSecurityPatterns(repoPath);
  const astResult = await analyzeAstDataFlow(repoPath);

  const codeFindings = [...securityResult.findings, ...astResult.findings];
  const [codeFindingsWithAi, dependencyFindingsWithAi] = await Promise.all([
    attachAiExplanations(codeFindings, locale),
    attachAiExplanations(dependencyFindings, locale)
  ]);

  return {
    repoUrl: sanitizedUrl,
    locale,
    summary: {
      total: codeFindingsWithAi.length + dependencyFindingsWithAi.length,
      codeFindings: codeFindingsWithAi.length,
      dependencyFindings: dependencyFindingsWithAi.length,
      securityFindings: securityResult.findings.length,
      astFindings: astResult.findings.length
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
    findings: codeFindingsWithAi,
    dependencyFindings: dependencyFindingsWithAi
  };
};
