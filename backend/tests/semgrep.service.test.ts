import child_process from 'child_process';
import { runSemgrep } from '../src/services/semgrep.service';

describe('runSemgrep', () => {
  const origExecFile = child_process.execFile;

  beforeAll(() => {
    // mock execFile to return a fake semgrep JSON
    (child_process as any).execFile = (cmd: any, args: any, opts: any, cb: any) => {
      const fake = JSON.stringify({ results: [
        {
          path: { file: 'src/index.js' },
          extra: { message: 'found', metadata: { severity: 'HIGH', category: 'XSS' } },
          check_id: 'scout.rule'
        }
      ]});
      cb(null, fake, '');
    };
  });

  afterAll(() => {
    (child_process as any).execFile = origExecFile;
  });

  it('parses semgrep output and returns findings with count', async () => {
    const res = await runSemgrep('/tmp/repo');
    expect(res.status).toBe('success');
    expect(res.count).toBeGreaterThanOrEqual(1);
    expect(res.findings.length).toBeGreaterThanOrEqual(1);
    expect(res.findings[0].category).toBe('XSS');
  });
});
