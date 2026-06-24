import { analyzeAstDataFlow } from '../analyzers/ast-analyzer';
import { analyzeDependencies } from '../analyzers/dependency-analyzer';
import { analyzeSecurityPatterns } from '../analyzers/security-analyzer';
import { prepareRepository } from '../services/repository.service';
import { generateAiExplanation } from './ai.service';

export const analyzeRepository = async (repoUrl: string) => {
  const sanitizedUrl = repoUrl.trim();
  const repoPath = await prepareRepository(sanitizedUrl);

  const dependencyFindings = await analyzeDependencies(repoPath);
  const securityResult = await analyzeSecurityPatterns(repoPath);
  const astResult = await analyzeAstDataFlow(repoPath);

  const findings = [...securityResult.findings, ...astResult.findings, ...dependencyFindings];
  const findingsWithAi = await Promise.all(
    findings.map(async (finding) => {
      const ai = await generateAiExplanation(finding);
      return {
        ...finding,
        aiExplanation: ai
      };
    })
  );

  return {
    repoUrl: sanitizedUrl,
    summary: {
      total: findingsWithAi.length,
      dependencyFindings: dependencyFindings.length,
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
    findings: findingsWithAi
  };
};
