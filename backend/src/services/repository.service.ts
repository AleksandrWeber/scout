import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'stream';
import * as unzipper from 'unzipper';
import { fetchRepositoryArchive } from './github.service';

export const prepareRepository = async (repoUrl: string): Promise<string> => {
  const archiveBuffer = await fetchRepositoryArchive(repoUrl);
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-repo-'));
  await extractArchive(archiveBuffer, tempRoot);
  return await findRepoRoot(tempRoot);
};

const extractArchive = async (archiveBuffer: Buffer, outDir: string) => {
  await fs.mkdir(outDir, { recursive: true });
  await pipeline(Readable.from(archiveBuffer), unzipper.Extract({ path: outDir }));
};

const findRepoRoot = async (rootDir: string): Promise<string> => {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  if (entries.length === 1 && entries[0].isDirectory()) {
    return path.join(rootDir, entries[0].name);
  }

  return rootDir;
};
