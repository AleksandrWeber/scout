import { buildExecutiveReport } from './build-executive';
import { buildTechnicalReport } from './build-technical';
import type { GeneratedReport, ReportBuildInput, ReportKind } from './types';

export const buildReport = (kind: ReportKind, input: ReportBuildInput): GeneratedReport => {
  if (kind === 'executive') {
    return buildExecutiveReport(input);
  }

  return buildTechnicalReport(input);
};

export { buildTechnicalReport } from './build-technical';
export { buildExecutiveReport } from './build-executive';
export { buildExecutiveNarrativeFallback } from './executive-narrative-fallback';
export { getProjectNameFromRepoUrl } from './project-name';
export { formatScanTimestamp } from './format-scan-time';
export {
  buildMailtoLink,
  buildTelegramShareLink,
  buildWhatsAppShareLink,
  truncateForMessenger
} from './share-links';
export type {
  ExecutiveNarrative,
  GeneratedReport,
  ReportBuildInput,
  ReportKind,
  ReportMeta
} from './types';
