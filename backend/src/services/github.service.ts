import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { GitHubRepositoryError } from '../errors/github.errors';
import { retryAsync } from '../utils/retry';

const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;

type CacheMetadata = {
  repoUrl: string;
  cachedAt: string;
  expiresAt: string;
};

export type ParsedGitHubRepo = {
  owner: string;
  repo: string;
};

const normalizeRepoUrl = (repoUrl: string) =>
  repoUrl.trim().replace(/\/+$/, '').replace(/\.git$/, '').toLowerCase();

export const parseGitHubRepoUrl = (repoUrl: string): ParsedGitHubRepo | null => {
  const normalized = normalizeRepoUrl(repoUrl);
  const match = normalized.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/);

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2]
  };
};

export const isGitHubTokenConfigured = () => Boolean(process.env.GITHUB_TOKEN?.trim());

const getAuthHeaders = () => {
  const token = process.env.GITHUB_TOKEN?.trim();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json'
  };
};

const getCacheDir = () => process.env.SCOUT_REPO_CACHE_DIR || path.join(os.tmpdir(), 'scout-repo-cache');

const getCacheTtlMs = () => {
  const value = Number(process.env.SCOUT_REPO_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CACHE_TTL_MS;
};

const getRetryOptions = () => ({
  maxAttempts: Number(process.env.SCOUT_GITHUB_MAX_RETRIES || DEFAULT_MAX_RETRIES),
  delayMs: Number(process.env.SCOUT_GITHUB_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS)
});

const getCachePaths = (repoUrl: string) => {
  const hash = crypto.createHash('sha256').update(normalizeRepoUrl(repoUrl)).digest('hex');
  const cacheDir = getCacheDir();

  return {
    archivePath: path.join(cacheDir, `${hash}.zip`),
    metadataPath: path.join(cacheDir, `${hash}.json`)
  };
};

const readCachedArchive = async (repoUrl: string): Promise<Buffer | null> => {
  const { archivePath, metadataPath } = getCachePaths(repoUrl);

  try {
    const metadataRaw = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataRaw) as CacheMetadata;

    if (new Date(metadata.expiresAt).getTime() <= Date.now()) {
      await Promise.allSettled([fs.unlink(archivePath), fs.unlink(metadataPath)]);
      return null;
    }

    return await fs.readFile(archivePath);
  } catch {
    return null;
  }
};

const writeCachedArchive = async (repoUrl: string, archive: Buffer) => {
  const cacheDir = getCacheDir();
  const { archivePath, metadataPath } = getCachePaths(repoUrl);
  const cachedAt = new Date();
  const metadata: CacheMetadata = {
    repoUrl: normalizeRepoUrl(repoUrl),
    cachedAt: cachedAt.toISOString(),
    expiresAt: new Date(cachedAt.getTime() + getCacheTtlMs()).toISOString()
  };

  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(archivePath, archive);
  await fs.writeFile(metadataPath, JSON.stringify(metadata));
};

const fetchDefaultBranch = async (owner: string, repo: string): Promise<string | null> => {
  if (!isGitHubTokenConfigured()) {
    return null;
  }

  try {
    const response = await retryAsync(
      () =>
        axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: getAuthHeaders(),
          timeout: 15_000
        }),
      getRetryOptions()
    );

    return response.data.default_branch || 'main';
  } catch {
    return null;
  }
};

const buildDownloadUrls = async (parsed: ParsedGitHubRepo) => {
  const { owner, repo } = parsed;

  if (isGitHubTokenConfigured()) {
    const defaultBranch = await fetchDefaultBranch(owner, repo);
    const branches = [...new Set([defaultBranch, 'main', 'master'].filter(Boolean))] as string[];

    return branches.map((branch) => `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`);
  }

  const base = `https://github.com/${owner}/${repo}`;
  return [`${base}/archive/refs/heads/main.zip`, `${base}/archive/refs/heads/master.zip`];
};

const mapDownloadError = (error: unknown, repoUrl: string): GitHubRepositoryError => {
  const parsed = parseGitHubRepoUrl(repoUrl);
  const repoLabel = parsed ? `${parsed.owner}/${parsed.repo}` : repoUrl;
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (status === 401) {
    return new GitHubRepositoryError(
      'GitHub rejected the configured GITHUB_TOKEN.',
      401,
      'GITHUB_TOKEN_INVALID',
      'Create a new token in GitHub Settings and update the local .env file. See docs/github-token-setup.md.'
    );
  }

  if (status === 403) {
    return new GitHubRepositoryError(
      `GitHub denied access to ${repoLabel}.`,
      403,
      'GITHUB_FORBIDDEN',
      isGitHubTokenConfigured()
        ? 'Make sure the token has access to this repository and is not rate-limited.'
        : 'Private repositories require GITHUB_TOKEN in the backend .env file. See docs/github-token-setup.md.'
    );
  }

  if (status === 404) {
    return new GitHubRepositoryError(
      `Repository ${repoLabel} was not found or is not accessible.`,
      404,
      'GITHUB_NOT_FOUND',
      isGitHubTokenConfigured()
        ? 'Check the repository URL and confirm your token can read this repository.'
        : 'If the repository is private, add GITHUB_TOKEN to the backend .env file. See docs/github-token-setup.md.'
    );
  }

  return new GitHubRepositoryError(
    'Could not download repository archive from GitHub. Check the repo URL and default branch.',
    502,
    'GITHUB_DOWNLOAD_FAILED',
    isGitHubTokenConfigured()
      ? 'Verify the repository URL, token scope, and network access.'
      : 'Public repositories work without a token. Private repositories need GITHUB_TOKEN. See docs/github-token-setup.md.'
  );
};

const downloadArchive = async (repoUrl: string): Promise<Buffer> => {
  const parsed = parseGitHubRepoUrl(repoUrl);

  if (!parsed) {
    throw new GitHubRepositoryError(
      'Only GitHub repository URLs are supported. Example: https://github.com/owner/repo',
      400,
      'INVALID_GITHUB_URL'
    );
  }

  const urls = await buildDownloadUrls(parsed);
  const retryOptions = getRetryOptions();
  const headers = getAuthHeaders();
  let lastError: unknown;

  for (const url of urls) {
    try {
      const response = await retryAsync(
        () =>
          axios.get(url, {
            responseType: 'arraybuffer',
            headers,
            timeout: 30_000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300
          }),
        retryOptions
      );

      return Buffer.from(response.data);
    } catch (error) {
      lastError = error;
    }
  }

  throw mapDownloadError(lastError, repoUrl);
};

export const fetchRepositoryArchive = async (repoUrl: string): Promise<Buffer> => {
  const cached = await readCachedArchive(repoUrl);
  if (cached) {
    return cached;
  }

  const archive = await downloadArchive(repoUrl);
  await writeCachedArchive(repoUrl, archive);
  return archive;
};

export const clearRepositoryArchiveCache = async () => {
  await fs.rm(getCacheDir(), { recursive: true, force: true });
};

export const __test__ = {
  getCacheDir,
  getCachePaths,
  normalizeRepoUrl,
  buildDownloadUrls
};
