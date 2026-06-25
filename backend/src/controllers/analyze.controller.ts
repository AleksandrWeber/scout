import { Request, Response } from 'express';
import { GitHubRepositoryError } from '../errors/github.errors';
import { LocalProjectError } from '../errors/local-project.errors';
import { isLocalPathScanEnabled } from '../config/scan-policy';
import { analyzeLocalProject, analyzeRepository } from '../services/report.service';

export const analyzeController = async (req: Request, res: Response) => {
  const { repoUrl, locale } = req.body;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  try {
    const report = await analyzeRepository(repoUrl, locale);
    return res.json(report);
  } catch (error) {
    console.error(error);

    if (error instanceof GitHubRepositoryError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    return res.status(500).json({ error: 'Failed to analyze repository' });
  }
};

export const analyzeLocalController = async (req: Request, res: Response) => {
  const { projectPath, locale } = req.body;

  if (!isLocalPathScanEnabled()) {
    return res.status(403).json({
      error: 'Local path scanning is disabled on this server',
      hint: 'Set SCOUT_ALLOW_LOCAL_PATHS=true to enable local scans.'
    });
  }

  if (!projectPath || typeof projectPath !== 'string') {
    return res.status(400).json({ error: 'projectPath is required' });
  }

  try {
    const report = await analyzeLocalProject(projectPath, { locale });
    return res.json(report);
  } catch (error) {
    console.error(error);

    if (error instanceof LocalProjectError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    return res.status(500).json({ error: 'Failed to analyze local project' });
  }
};
