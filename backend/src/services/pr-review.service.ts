import fs from 'fs/promises';
import { enrichFindingsWithOwasp } from '../../../shared/owasp';
import { GitHubRepositoryError } from '../errors/github.errors';
import {
  materializePullRequestWorkspace,
  parsePullRequestInput,
  type PullRequestRef
} from './github.service';
import { analyzeProjectAtPath } from './report.service';

const normalizePath = (filePath: string) => filePath.replace(/\\/g, '/');

const findingMatchesChangedFiles = (finding: { file: string }, changedFiles: Set<string>) => {
  const file = normalizePath(finding.file);
  if (!file || file === 'N/A') {
    return false;
  }

  if (changedFiles.has(file)) {
    return true;
  }

  return [...changedFiles].some((changed) => file === changed || file.endsWith(`/${changed}`));
};

const buildPullRequestDisplayUrl = (ref: PullRequestRef) =>
  `https://github.com/${ref.owner}/${ref.repo}/pull/${ref.pullNumber}`;

const recalculateSummary = (
  codeFindings: Array<{ category: string }>,
  dependencyFindings: Array<unknown>
) => ({
  total: codeFindings.length + dependencyFindings.length,
  codeFindings: codeFindings.length,
  dependencyFindings: dependencyFindings.length,
  securityFindings: codeFindings.filter(
    (finding) =>
      finding.category !== 'AST_DATA_FLOW' &&
      finding.category !== 'SECRET' &&
      !finding.category.startsWith('DEPENDENCY')
  ).length,
  astFindings: codeFindings.filter((finding) => finding.category === 'AST_DATA_FLOW').length,
  secretFindings: codeFindings.filter((finding) => finding.category === 'SECRET').length
});

export const analyzePullRequest = async (input: {
  pullRequestUrl?: string;
  repoUrl?: string;
  pullNumber?: number;
  locale?: unknown;
  includeAi?: boolean;
}) => {
  const ref = parsePullRequestInput(input);

  if (!ref || !Number.isFinite(ref.pullNumber) || ref.pullNumber <= 0) {
    throw new GitHubRepositoryError(
      'A valid GitHub pull request URL is required. Example: https://github.com/owner/repo/pull/42',
      400,
      'INVALID_PULL_REQUEST_URL'
    );
  }

  const { workspacePath, meta, changedFiles, analyzedFilenames } =
    await materializePullRequestWorkspace(ref);

  try {
    const changedSet = new Set(analyzedFilenames.map(normalizePath));
    const packageChanged = analyzedFilenames.some(
      (filename) => filename === 'package.json' || filename === 'package-lock.json'
    );

    const baseReport = await analyzeProjectAtPath(workspacePath, {
      locale: input.locale,
      includeAi: input.includeAi,
      source: 'pullRequest',
      displayUrl: meta.htmlUrl || buildPullRequestDisplayUrl(ref),
      projectPath: workspacePath,
      projectName: `${ref.owner}/${ref.repo}#${ref.pullNumber}`
    });

    const filteredCodeFindings = baseReport.findings.filter((finding) =>
      findingMatchesChangedFiles(finding, changedSet)
    );
    const dependencyFindings = packageChanged ? baseReport.dependencyFindings : [];

    const findings = enrichFindingsWithOwasp(filteredCodeFindings);
    const dependencyFindingsWithOwasp = enrichFindingsWithOwasp(dependencyFindings);

    return {
      ...baseReport,
      source: 'pullRequest' as const,
      repoUrl: meta.htmlUrl || buildPullRequestDisplayUrl(ref),
      prReview: {
        pullNumber: meta.number,
        title: meta.title,
        htmlUrl: meta.htmlUrl,
        headSha: meta.headSha,
        baseSha: meta.baseSha,
        changedFiles: changedFiles.length,
        analyzedFiles: analyzedFilenames.length
      },
      findings,
      dependencyFindings: dependencyFindingsWithOwasp,
      summary: recalculateSummary(filteredCodeFindings, dependencyFindings)
    };
  } finally {
    await fs.rm(workspacePath, { recursive: true, force: true });
  }
};
