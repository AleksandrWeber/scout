import fs from 'fs/promises';
import path from 'path';

describe('.semgrep.yml', () => {
  it('defines an expanded Scout rule set for V2', async () => {
    const configPath = path.join(__dirname, '../.semgrep.yml');
    const raw = await fs.readFile(configPath, 'utf8');

    expect(raw).toContain('scout.child-process-exec');
    expect(raw).toContain('scout.hardcoded-secret-assignment');
    expect(raw).toContain('scout.insecure-postmessage');
    expect((raw.match(/- id: scout\./g) || []).length).toBeGreaterThanOrEqual(8);
  });
});
