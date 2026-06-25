import fs from 'fs/promises';
import { GitHubRepositoryError } from '../src/errors/github.errors';
import { analyzeProjectAtPath } from '../src/services/report.service';
import { analyzePullRequest } from '../src/services/pr-review.service';
import { materializePullRequestWorkspace } from '../src/services/github.service';

jest.mock('../src/services/github.service', () => {
  const actual = jest.requireActual('../src/services/github.service');
  return {
    ...actual,
    materializePullRequestWorkspace: jest.fn()
  };
});

jest.mock('../src/services/report.service', () => ({
  analyzeProjectAtPath: jest.fn()
}));

const mockedMaterialize = materializePullRequestWorkspace as jest.MockedFunction<
  typeof materializePullRequestWorkspace
>;
const mockedAnalyzeProject = analyzeProjectAtPath as jest.MockedFunction<typeof analyzeProjectAtPath>;

describe('analyzePullRequest', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('filters findings to changed files and attaches PR metadata', async () => {
    const workspacePath = '/tmp/scout-pr-test';
    mockedMaterialize.mockResolvedValue({
      workspacePath,
      meta: {
        number: 12,
        title: 'Security fixes',
        htmlUrl: 'https://github.com/acme/app/pull/12',
        headSha: 'head',
        baseSha: 'base',
        state: 'open'
      },
      changedFiles: [{ filename: 'src/app.ts', status: 'modified' }],
      analyzedFilenames: ['src/app.ts']
    });

    mockedAnalyzeProject.mockResolvedValue({
      source: 'pullRequest',
      repoUrl: 'https://github.com/acme/app/pull/12',
      projectName: 'acme/app#12',
      projectPath: undefined,
      locale: 'en',
      summary: {
        total: 2,
        codeFindings: 2,
        dependencyFindings: 0,
        securityFindings: 2,
        astFindings: 0,
        secretFindings: 0
      },
      secrets: { filesScanned: 1, count: 0 },
      ast: { filesScanned: 1, parseErrors: 0, count: 0 },
      semgrep: { status: 'success', message: '', count: 0 },
      agentsReview: {
        agents: [
          { id: 'supply-chain', name: 'Supply Chain', status: 'success', findingsCount: 0, durationMs: 1 },
          { id: 'code-security', name: 'Code Security', status: 'success', findingsCount: 0, durationMs: 1 }
        ]
      },
      findings: [
        {
          severity: 'HIGH',
          category: 'XSS',
          file: 'src/app.ts',
          scoutAgent: 'code-security',
          description: 'in pr file',
          risk: 'xss',
          fix: 'fix',
          education: 'edu'
        },
        {
          severity: 'LOW',
          category: 'XSS',
          file: 'src/other.ts',
          scoutAgent: 'code-security',
          description: 'outside pr',
          risk: 'xss',
          fix: 'fix',
          education: 'edu'
        }
      ],
      dependencyFindings: []
    });

    const report = await analyzePullRequest({
      pullRequestUrl: 'https://github.com/acme/app/pull/12'
    });

    expect(report.prReview?.pullNumber).toBe(12);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].file).toBe('src/app.ts');
    expect(report.findings[0].owasp?.id).toBe('A03:2021');
    expect(report.summary.codeFindings).toBe(1);
    expect(mockedAnalyzeProject).toHaveBeenCalledWith(
      workspacePath,
      expect.objectContaining({ source: 'pullRequest' })
    );
    await expect(fs.stat(workspacePath)).rejects.toThrow();
  });

  it('rejects invalid pull request URLs', async () => {
    await expect(analyzePullRequest({ pullRequestUrl: 'https://github.com/acme/app' })).rejects.toBeInstanceOf(
      GitHubRepositoryError
    );
  });
});
