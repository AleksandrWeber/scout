import { analyzeDependencies } from '../analyzers/dependency-analyzer';
import { analyzeSecurityPatterns } from '../analyzers/security-analyzer';
import { prepareRepository } from '../services/repository.service';

export const analyzeRepository = async (repoUrl: string) => {
  const sanitizedUrl = repoUrl.trim();
  const repoPath = await prepareRepository(sanitizedUrl);

  const dependencyFindings = await analyzeDependencies(repoPath);
  const securityResult = await analyzeSecurityPatterns(repoPath);

  return {
    repoUrl: sanitizedUrl,
    summary: {
      total: dependencyFindings.length + securityResult.findings.length,
      dependencyFindings: dependencyFindings.length,
      securityFindings: securityResult.findings.length
    },
    semgrep: {
      status: securityResult.semgrepStatus,
      message: securityResult.semgrepMessage,
      count: securityResult.semgrepCount
    },
    findings: [...securityResult.findings, ...dependencyFindings]
  };
};
