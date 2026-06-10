import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { retryAsync } from '../utils/retry';

const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;

type CacheMetadata = {
  repoUrl: string;
  cachedAt: string;
  expiresAt: string;
};

const normalizeRepoUrl = (repoUrl: string) =>
  repoUrl.trim().replace(/\/+$/, '').replace(/\.git$/, '').toLowerCase();

const getArchiveUrls = (repoUrl: string) => {
  const base = repoUrl.replace(/\.git$/, '').replace(/\/+$/, '');
  return [`${base}/archive/refs/heads/main.zip`, `${base}/archive/refs/heads/master.zip`];
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

const downloadArchive = async (repoUrl: string): Promise<Buffer> => {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const urls = getArchiveUrls(repoUrl);
  const retryOptions = getRetryOptions();
  let lastError: unknown;

  for (const url of urls) {
    try {
      const response = await retryAsync(
        () =>
          axios.get(url, {
            responseType: 'arraybuffer',
            headers,
            timeout: 30_000,
            validateStatus: (status) => status >= 200 && status < 300
          }),
        retryOptions
      );

      return Buffer.from(response.data);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Could not download repository archive from GitHub. Check the repo URL and default branch.');
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
  normalizeRepoUrl
};
