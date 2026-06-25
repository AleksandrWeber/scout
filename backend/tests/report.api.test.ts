import request from 'supertest';
import app from '../src/app';
import { generateExecutiveNarrative } from '../src/services/executive-report.service';

jest.mock('../src/services/executive-report.service', () => ({
  generateExecutiveNarrative: jest.fn()
}));

const mockedGenerateExecutiveNarrative = generateExecutiveNarrative as jest.MockedFunction<
  typeof generateExecutiveNarrative
>;

const payload = {
  repoUrl: 'https://github.com/acme/web-app',
  scannedAt: '2026-06-10T14:30:00.000Z',
  locale: 'en',
  summary: {
    total: 1,
    codeFindings: 1,
    dependencyFindings: 0,
    securityFindings: 1
  },
  findings: [
    {
      severity: 'HIGH',
      category: 'XSS',
      file: 'src/App.tsx',
      description: 'User input reaches innerHTML',
      risk: 'Script injection risk',
      fix: 'Sanitize output',
      education: 'XSS basics'
    }
  ],
  dependencyFindings: []
};

describe('/api/reports/executive', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 when repoUrl is missing', async () => {
    const response = await request(app).post('/api/reports/executive').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'repoUrl is required' });
  });

  it('returns executive narrative', async () => {
    mockedGenerateExecutiveNarrative.mockResolvedValue({
      provider: 'local',
      narrative: {
        overview: 'Critical issues need attention soon.',
        priorities: ['Fix XSS in App.tsx'],
        nextSteps: ['Assign developers to patch high severity findings']
      }
    });

    const response = await request(app).post('/api/reports/executive').send(payload);

    expect(response.status).toBe(200);
    expect(response.body.provider).toBe('local');
    expect(response.body.narrative.overview).toContain('Critical issues');
    expect(mockedGenerateExecutiveNarrative).toHaveBeenCalled();
  });
});
