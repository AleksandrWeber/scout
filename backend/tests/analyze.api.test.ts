import request from 'supertest';
import app from '../src/app';
import { analyzeRepository } from '../src/services/report.service';

jest.mock('../src/services/report.service', () => ({
  analyzeRepository: jest.fn()
}));

const mockedAnalyzeRepository = analyzeRepository as jest.MockedFunction<typeof analyzeRepository>;

describe('/api/analyze', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 if repoUrl is missing', async () => {
    const response = await request(app).post('/api/analyze').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'repoUrl is required' });
  });

  it('returns the analysis report when repoUrl is valid', async () => {
    mockedAnalyzeRepository.mockResolvedValue({
      repoUrl: 'https://github.com/test/repo',
      summary: {
        total: 0,
        dependencyFindings: 0,
        securityFindings: 0,
        astFindings: 0
      },
      ast: {
        filesScanned: 0,
        parseErrors: 0,
        count: 0
      },
      semgrep: {
        status: 'success',
        message: '',
        count: 0
      },
      findings: []
    });

    const response = await request(app)
      .post('/api/analyze')
      .send({ repoUrl: 'https://github.com/test/repo' });

    expect(response.status).toBe(200);
    expect(response.body.repoUrl).toBe('https://github.com/test/repo');
    expect(response.body.summary.dependencyFindings).toBe(0);
    expect(response.body.findings).toEqual([]);
  });
});
