import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { runSemgrep } from '../src/services/semgrep.service';

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  execFile: jest.fn()
}));

const mockedExecFile = execFile as unknown as jest.Mock;

describe('runSemgrep', () => {
  let tempRepo = '';

  beforeAll(async () => {
    tempRepo = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-semgrep-'));
    await fs.writeFile(path.join(tempRepo, 'index.js'), 'console.log("test");');
  });

  afterAll(async () => {
    if (tempRepo) {
      await fs.rm(tempRepo, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    mockedExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: (error: null, stdout: string, stderr: string) => void) => {
        const fake = JSON.stringify({
          results: [
          {
            path: 'src/index.js',
            start: { line: 7 },
            extra: { message: 'found', metadata: { severity: 'HIGH', category: 'XSS' } },
            check_id: 'scout.rule'
          }
          ]
        });
        cb(null, fake, '');
      }
    );
  });

  afterEach(() => {
    mockedExecFile.mockReset();
  });

  it('parses semgrep output and returns findings with count', async () => {
    const res = await runSemgrep(tempRepo);
    expect(res.status).toBe('success');
    expect(res.count).toBeGreaterThanOrEqual(1);
    expect(res.findings.length).toBeGreaterThanOrEqual(1);
    expect(res.findings[0].category).toBe('XSS');
  });
});
