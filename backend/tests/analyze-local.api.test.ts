import path from 'path';
import request from 'supertest';
import app from '../src/app';
import { analyzeLocalProject } from '../src/services/report.service';

jest.mock('../src/services/report.service', () => ({
  analyzeRepository: jest.fn(),
  analyzeLocalProject: jest.fn()
}));

const mockedAnalyzeLocalProject = analyzeLocalProject as jest.MockedFunction<typeof analyzeLocalProject>;

describe('/api/analyze/local', () => {
  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.SCOUT_ALLOW_LOCAL_PATHS;
  });

  it('returns 400 when projectPath is missing', async () => {
    const response = await request(app).post('/api/analyze/local').send({});
    expect(response.status).toBe(400);
  });

  it('returns local analysis report', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/sample-repo');
    mockedAnalyzeLocalProject.mockResolvedValue({
      source: 'local',
      repoUrl: `file://${fixturePath}`,
      projectPath: fixturePath,
      projectName: 'sample-repo',
      locale: 'en',
      summary: {
        total: 1,
        codeFindings: 1,
        dependencyFindings: 0,
        securityFindings: 1,
        astFindings: 0,
        secretFindings: 0
      },
      secrets: { filesScanned: 2, count: 0 },
      ast: { filesScanned: 1, parseErrors: 0, count: 0 },
      semgrep: { status: 'success', message: '', count: 0 },
      agentsReview: {
        agents: [
          { id: 'supply-chain', name: 'Supply Chain', status: 'success', findingsCount: 0, durationMs: 1 },
          { id: 'code-security', name: 'Code Security', status: 'success', findingsCount: 1, durationMs: 1 }
        ]
      },
      findings: [],
      dependencyFindings: []
    });

    const response = await request(app)
      .post('/api/analyze/local')
      .send({ projectPath: fixturePath });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('local');
    expect(response.body.projectName).toBe('sample-repo');
  });

  it('returns 403 when local scans are disabled', async () => {
    process.env.SCOUT_ALLOW_LOCAL_PATHS = 'false';

    const response = await request(app)
      .post('/api/analyze/local')
      .send({ projectPath: '/tmp/project' });

    expect(response.status).toBe(403);
  });
});
