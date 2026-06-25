import request from 'supertest';
import app from '../src/app';

describe('/api/knowledge/search', () => {
  afterEach(() => {
    delete process.env.SCOUT_RAG_ENABLED;
  });

  it('returns 400 when q is missing', async () => {
    const response = await request(app).get('/api/knowledge/search');
    expect(response.status).toBe(400);
  });

  it('returns ranked knowledge sources for a query', async () => {
    process.env.SCOUT_RAG_ENABLED = 'true';

    const response = await request(app).get('/api/knowledge/search').query({ q: 'npm audit dependency CVE' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.sources)).toBe(true);
    expect(response.body.sources.length).toBeGreaterThan(0);
  });
});
