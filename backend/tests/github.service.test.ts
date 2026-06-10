import axios from 'axios';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  __test__,
  clearRepositoryArchiveCache,
  fetchRepositoryArchive
} from '../src/services/github.service';

jest.mock('axios');

const mockedAxiosGet = axios.get as jest.Mock;

describe('fetchRepositoryArchive', () => {
  let cacheDir = '';

  beforeEach(async () => {
    cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-github-cache-'));
    process.env.SCOUT_REPO_CACHE_DIR = cacheDir;
    process.env.SCOUT_REPO_CACHE_TTL_MS = '3600000';
    process.env.SCOUT_GITHUB_MAX_RETRIES = '3';
    process.env.SCOUT_GITHUB_RETRY_DELAY_MS = '1';
    mockedAxiosGet.mockReset();
  });

  afterEach(async () => {
    await clearRepositoryArchiveCache();
    delete process.env.SCOUT_REPO_CACHE_DIR;
    delete process.env.SCOUT_REPO_CACHE_TTL_MS;
    delete process.env.SCOUT_GITHUB_MAX_RETRIES;
    delete process.env.SCOUT_GITHUB_RETRY_DELAY_MS;
  });

  it('returns a buffer when axios returns arraybuffer data', async () => {
    mockedAxiosGet.mockResolvedValue({ data: Buffer.from('zipdata') });

    const buf = await fetchRepositoryArchive('https://github.com/owner/repo');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('zipdata');
  });

  it('retries transient GitHub failures before succeeding', async () => {
    mockedAxiosGet
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: Buffer.from('zipdata') });

    const buf = await fetchRepositoryArchive('https://github.com/owner/retry-repo');

    expect(buf.toString()).toBe('zipdata');
    expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
  });

  it('serves repeated downloads from the local archive cache', async () => {
    mockedAxiosGet.mockResolvedValue({ data: Buffer.from('cached-zip') });

    const repoUrl = 'https://github.com/owner/cache-repo';
    const first = await fetchRepositoryArchive(repoUrl);
    const second = await fetchRepositoryArchive(repoUrl);

    expect(first.toString()).toBe('cached-zip');
    expect(second.toString()).toBe('cached-zip');
    expect(mockedAxiosGet).toHaveBeenCalledTimes(1);

    const { archivePath, metadataPath } = __test__.getCachePaths(repoUrl);
    await expect(fs.stat(archivePath)).resolves.toBeDefined();
    await expect(fs.readFile(metadataPath, 'utf8')).resolves.toContain('cache-repo');
  });
});
