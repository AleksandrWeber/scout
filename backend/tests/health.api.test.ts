import request from 'supertest';
import app from '../src/app';
import { resetMetricsForTests } from '../src/middleware/observability';
import * as healthService from '../src/services/health.service';

describe('health endpoints', () => {
  beforeEach(() => {
    resetMetricsForTests();
    jest.restoreAllMocks();
  });

  it('returns liveness information from /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('scout-backend');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('returns readiness information from /health/ready', async () => {
    jest.spyOn(healthService, 'isSemgrepAvailable').mockResolvedValue(true);

    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.checks.semgrep).toBe('ok');
    expect(['gemini', 'openai', 'local']).toContain(response.body.checks.aiProvider);
  });

  it('returns degraded readiness when Semgrep is unavailable', async () => {
    jest.spyOn(healthService, 'isSemgrepAvailable').mockResolvedValue(false);

    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('degraded');
    expect(response.body.checks.semgrep).toBe('unavailable');
  });

  it('returns basic metrics from /health/metrics', async () => {
    await request(app).get('/health');

    const response = await request(app).get('/health/metrics');

    expect(response.status).toBe(200);
    expect(response.body.requestsTotal).toBeGreaterThanOrEqual(1);
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });
});
