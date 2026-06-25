import { Request, Response } from 'express';
import { normalizeLocale } from '../../../shared/localization';
import { getProjectNameFromRepoUrl, type ReportBuildInput } from '../../../shared/reports';
import { generateExecutiveNarrative } from '../services/executive-report.service';
import { createSharedReport, getSharedReport } from '../services/report-share.service';

const isValidSummary = (summary: unknown): summary is ReportBuildInput['summary'] => {
  if (!summary || typeof summary !== 'object') {
    return false;
  }

  const value = summary as Record<string, unknown>;
  return (
    typeof value.total === 'number' &&
    typeof value.codeFindings === 'number' &&
    typeof value.dependencyFindings === 'number'
  );
};

const isFindingArray = (value: unknown): value is ReportBuildInput['findings'] => Array.isArray(value);

export const executiveReportController = async (req: Request, res: Response) => {
  const {
    projectName,
    repoUrl,
    scannedAt,
    locale,
    findings,
    dependencyFindings,
    summary
  } = req.body;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  if (!scannedAt || typeof scannedAt !== 'string') {
    return res.status(400).json({ error: 'scannedAt is required' });
  }

  if (!isValidSummary(summary)) {
    return res.status(400).json({ error: 'summary is required' });
  }

  if (!isFindingArray(findings) || !isFindingArray(dependencyFindings)) {
    return res.status(400).json({ error: 'findings and dependencyFindings must be arrays' });
  }

  const input: ReportBuildInput = {
    projectName:
      typeof projectName === 'string' && projectName.trim()
        ? projectName.trim()
        : getProjectNameFromRepoUrl(repoUrl),
    repoUrl,
    scannedAt,
    locale: normalizeLocale(locale),
    findings,
    dependencyFindings,
    summary
  };

  try {
    const response = await generateExecutiveNarrative(input);
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate executive report narrative' });
  }
};

export const shareReportController = async (req: Request, res: Response) => {
  const { html, title } = req.body;

  if (!html || typeof html !== 'string') {
    return res.status(400).json({ error: 'html is required' });
  }

  try {
    const shared = await createSharedReport({
      html,
      title: typeof title === 'string' ? title : 'Scout report'
    });

    return res.json(shared);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create share link';
    const statusCode = message.includes('too large') ? 413 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const getSharedReportController = async (req: Request, res: Response) => {
  const token = req.params.token;

  try {
    const record = await getSharedReport(token);

    if (!record) {
      return res.status(404).json({ error: 'Shared report not found or expired' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(record.html);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load shared report' });
  }
};
