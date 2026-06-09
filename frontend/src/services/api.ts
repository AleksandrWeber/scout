import { AnalysisReport } from '../types';

export const analyzeRepository = async (repoUrl: string): Promise<AnalysisReport> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl })
  });

  if (!response.ok) {
    throw new Error('Failed to analyze repository');
  }

  return response.json();
};
