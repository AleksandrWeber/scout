import { AnalysisReport, ChatMessage, Finding } from '../types';

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

export const sendSecurityChatMessage = async (payload: {
  finding: Finding;
  message: string;
  history?: ChatMessage[];
}): Promise<{ reply: string; provider: string }> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send chat message');
  }

  return response.json();
};
