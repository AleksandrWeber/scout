import { AnalysisReport, ChatMessage, Finding } from '../types';
import type { ExecutiveNarrative, ReportBuildInput } from '@shared/reports';

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
}): Promise<{ reply: string; provider: string; knowledgeSources?: Array<{ title: string; sourceFile: string }> }> => {
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

export const fetchExecutiveNarrative = async (
  input: ReportBuildInput
): Promise<{ narrative: ExecutiveNarrative; provider: string }> => {
  const response = await fetch('/api/reports/executive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate executive narrative');
  }

  return response.json();
};

export const createReportShareLink = async (payload: {
  html: string;
  title: string;
}): Promise<{ token: string; expiresAt: string; sharePath: string }> => {
  const response = await fetch('/api/reports/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create share link');
  }

  return response.json();
};

export const buildShareUrl = (sharePath: string): string => `${window.location.origin}${sharePath}`;
