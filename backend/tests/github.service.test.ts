import axios from 'axios';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { GitHubRepositoryError } from '../src/errors/github.errors';
import {
  __test__,
  clearRepositoryArchiveCache,
  fetchRepositoryArchive,
  isGitHubTokenConfigured,
  parseGitHubPullRequestUrl,
  parseGitHubRepoUrl
} from '../src/services/github.service';

jest.mock('axios');

const mockedAxiosGet = axios.get as jest.Mock;

describe('parseGitHubRepoUrl', () => {
  it('parses a standard GitHub repository URL', () => {
    expect(parseGitHubRepoUrl('https://github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo'
    });
  });

  it('normalizes trailing slashes and .git suffix', () => {
    expect(parseGitHubRepoUrl('https://github.com/Owner/Repo.git/')).toEqual({
      owner: 'owner',
      repo: 'repo'
    });
  });
});

describe('parseGitHubPullRequestUrl', () => {
  it('parses a standard GitHub pull request URL', () => {
    expect(parseGitHubPullRequestUrl('https://github.com/owner/repo/pull/42')).toEqual({
      owner: 'owner',
      repo: 'repo',
      pullNumber: 42
    });
  });

  it('normalizes trailing slashes', () => {
    expect(parseGitHubPullRequestUrl('https://github.com/Owner/Repo/pull/7/')).toEqual({
      owner: 'owner',
      repo: 'repo',
      pullNumber: 7
    });
  });
});

describe('fetchRepositoryArchive', () => {
  let cacheDir = '';

  beforeEach(async () => {
    cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-github-cache-'));
    process.env.SCOUT_REPO_CACHE_DIR = cacheDir;
    process.env.SCOUT_REPO_CACHE_TTL_MS = '3600000';
    process.env.SCOUT_GITHUB_MAX_RETRIES = '3';
    process.env.SCOUT_GITHUB_RETRY_DELAY_MS = '1';
    delete process.env.GITHUB_TOKEN;
    mockedAxiosGet.mockReset();
  });

  afterEach(async () => {
    await clearRepositoryArchiveCache();
    delete process.env.SCOUT_REPO_CACHE_DIR;
    delete process.env.SCOUT_REPO_CACHE_TTL_MS;
    delete process.env.SCOUT_GITHUB_MAX_RETRIES;
    delete process.env.SCOUT_GITHUB_RETRY_DELAY_MS;
    delete process.env.GITHUB_TOKEN;
  });

  it('returns a buffer when axios returns arraybuffer data', async () => {
    mockedAxiosGet.mockResolvedValue({ data: Buffer.from('zipdata') });

    const buf = await fetchRepositoryArchive('https://github.com/owner/repo');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('zipdata');
    expect(mockedAxiosGet.mock.calls[0][0]).toContain('/archive/refs/heads/main.zip');
  });

  it('uses the GitHub API zipball flow when GITHUB_TOKEN is configured', async () => {
    process.env.GITHUB_TOKEN = 'ghp_test_token';
    mockedAxiosGet
      .mockResolvedValueOnce({ data: { default_branch: 'develop' } })
      .mockResolvedValueOnce({ data: Buffer.from('private-zip') });

    const buf = await fetchRepositoryArchive('https://github.com/owner/private-repo');

    expect(buf.toString()).toBe('private-zip');
    expect(mockedAxiosGet.mock.calls[0][0]).toBe('https://api.github.com/repos/owner/private-repo');
    expect(mockedAxiosGet.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/owner/private-repo/zipball/develop'
    );
    expect(mockedAxiosGet.mock.calls[1][1].headers.Authorization).toBe('Bearer ghp_test_token');
    expect(isGitHubTokenConfigured()).toBe(true);
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

  it('throws a helpful error for private repository access failures', async () => {
    mockedAxiosGet.mockRejectedValue({ response: { status: 404 } });

    await expect(fetchRepositoryArchive('https://github.com/owner/private-repo')).rejects.toMatchObject({
      statusCode: 404,
      code: 'GITHUB_NOT_FOUND'
    });
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

  it('rejects unsupported repository hosts', async () => {
    await expect(fetchRepositoryArchive('https://gitlab.com/owner/repo')).rejects.toBeInstanceOf(
      GitHubRepositoryError
    );
  });
});
