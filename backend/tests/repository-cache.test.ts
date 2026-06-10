import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { retryAsync } from '../src/utils/retry';

describe('retryAsync', () => {
  it('retries until the operation succeeds', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce('ok');

    const result = await retryAsync(operation, { maxAttempts: 3, delayMs: 1 });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('throws after the maximum number of attempts', async () => {
    const operation = jest.fn().mockRejectedValue({ response: { status: 503 } });

    await expect(retryAsync(operation, { maxAttempts: 2, delayMs: 1 })).rejects.toEqual({
      response: { status: 503 }
    });
    expect(operation).toHaveBeenCalledTimes(2);
  });
});

describe('github archive cache integration', () => {
  it('stores cache files under the configured cache directory', async () => {
    const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-cache-dir-'));
    process.env.SCOUT_REPO_CACHE_DIR = cacheDir;

    const { __test__ } = await import('../src/services/github.service');
    const paths = __test__.getCachePaths('https://github.com/owner/repo');

    expect(paths.archivePath.startsWith(cacheDir)).toBe(true);
    expect(__test__.normalizeRepoUrl('https://github.com/Owner/Repo.git/')).toBe(
      'https://github.com/owner/repo'
    );

    delete process.env.SCOUT_REPO_CACHE_DIR;
    await fs.rm(cacheDir, { recursive: true, force: true });
  });
});
