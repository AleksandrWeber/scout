import request from 'supertest';
import app from '../src/app';
import { analyzePullRequest } from '../src/services/pr-review.service';

jest.mock('../src/services/pr-review.service', () => ({
  analyzePullRequest: jest.fn()
}));

const mockedAnalyzePullRequest = analyzePullRequest as jest.MockedFunction<typeof analyzePullRequest>;

describe('/api/analyze/pr', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 if pull request input is missing', async () => {
    const response = await request(app).post('/api/analyze/pr').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('pullRequestUrl');
  });

  it('returns the PR analysis report when pullRequestUrl is valid', async () => {
    mockedAnalyzePullRequest.mockResolvedValue({
      source: 'pullRequest',
      repoUrl: 'https://github.com/test/repo/pull/7',
      projectName: 'test/repo#7',
      projectPath: undefined,
      locale: 'en',
      prReview: {
        pullNumber: 7,
        title: 'Add auth',
        htmlUrl: 'https://github.com/test/repo/pull/7',
        headSha: 'abc123',
        baseSha: 'def456',
        changedFiles: 2,
        analyzedFiles: 2
      },
      summary: {
        total: 1,
        codeFindings: 1,
        dependencyFindings: 0,
        securityFindings: 1,
        astFindings: 0,
        secretFindings: 0
      },
      secrets: { filesScanned: 1, count: 0 },
      ast: { filesScanned: 1, parseErrors: 0, count: 0 },
      semgrep: { status: 'success', message: '', count: 0 },
      agentsReview: {
        agents: [
          { id: 'supply-chain', name: 'Supply Chain', status: 'success', findingsCount: 0, durationMs: 1 },
          { id: 'code-security', name: 'Code Security', status: 'success', findingsCount: 1, durationMs: 1 }
        ]
      },
      findings: [
        {
          severity: 'HIGH',
          category: 'XSS',
          file: 'src/app.ts',
          scoutAgent: 'code-security',
          description: 'Unsafe HTML injection',
          risk: 'XSS',
          fix: 'Sanitize',
          education: 'Learn XSS',
          owasp: { id: 'A03:2021', name: 'Injection' }
        }
      ],
      dependencyFindings: []
    });

    const response = await request(app)
      .post('/api/analyze/pr')
      .send({ pullRequestUrl: 'https://github.com/test/repo/pull/7' });

    expect(response.status).toBe(200);
    expect(response.body.prReview.pullNumber).toBe(7);
    expect(response.body.findings[0].owasp.id).toBe('A03:2021');
  });
});
