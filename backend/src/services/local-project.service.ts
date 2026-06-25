import fs from 'fs/promises';
import path from 'path';
import { LocalProjectError } from '../errors/local-project.errors';

export const resolveLocalProjectPath = async (inputPath: string): Promise<string> => {
  const trimmed = inputPath.trim();

  if (!trimmed) {
    throw new LocalProjectError('Project path is required', 'LOCAL_PROJECT_PATH_REQUIRED');
  }

  const resolved = path.resolve(trimmed);

  let stats;
  try {
    stats = await fs.stat(resolved);
  } catch {
    throw new LocalProjectError(`Project path does not exist: ${resolved}`, 'LOCAL_PROJECT_NOT_FOUND', 404);
  }

  if (!stats.isDirectory()) {
    throw new LocalProjectError(`Project path is not a directory: ${resolved}`, 'LOCAL_PROJECT_NOT_DIRECTORY');
  }

  return resolved;
};

export const getProjectNameFromPath = (projectPath: string): string => path.basename(projectPath) || projectPath;
