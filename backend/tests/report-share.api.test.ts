import request from 'supertest';
import app from '../src/app';
import { createSharedReport, getSharedReport, __test__ } from '../src/services/report-share.service';

describe('report share service', () => {
  afterEach(async () => {
    const directory = __test__.getShareDirectory();
    const entries = await import('fs/promises').then((fs) => fs.readdir(directory).catch(() => []));
    await Promise.all(entries.map((entry) => __test__.deleteRecord(entry.replace(/\.json$/, ''))));
  });

  it('creates and retrieves a shared report', async () => {
    const created = await createSharedReport({
      title: 'Sample report',
      html: '<!DOCTYPE html><html><body><h1>Shared</h1></body></html>'
    });

    const record = await getSharedReport(created.token);
    expect(record?.title).toBe('Sample report');
    expect(record?.html).toContain('Shared');
  });
});

describe('/api/reports/share', () => {
  it('returns 400 when html is missing', async () => {
    const response = await request(app).post('/api/reports/share').send({});
    expect(response.status).toBe(400);
  });

  it('creates a share link', async () => {
    const response = await request(app).post('/api/reports/share').send({
      title: 'Executive summary',
      html: '<!DOCTYPE html><html><body><p>Hello</p></body></html>'
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toMatch(/^[a-f0-9-]{36}$/i);
    expect(response.body.sharePath).toContain('/api/reports/shared/');
  });
});

describe('GET /api/reports/shared/:token', () => {
  it('returns shared HTML', async () => {
    const created = await createSharedReport({
      title: 'Shared HTML',
      html: '<!DOCTYPE html><html><body><p>Shared report body</p></body></html>'
    });

    const response = await request(app).get(created.sharePath);
    expect(response.status).toBe(200);
    expect(response.text).toContain('Shared report body');
  });

  it('returns 404 for unknown token', async () => {
    const response = await request(app).get('/api/reports/shared/00000000-0000-4000-8000-000000000000');
    expect(response.status).toBe(404);
  });
});
