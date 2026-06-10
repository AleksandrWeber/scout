import { Request, Response } from 'express';
import { GitHubRepositoryError } from '../errors/github.errors';
import { analyzeRepository } from '../services/report.service';

export const analyzeController = async (req: Request, res: Response) => {
  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  try {
    const report = await analyzeRepository(repoUrl);
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
