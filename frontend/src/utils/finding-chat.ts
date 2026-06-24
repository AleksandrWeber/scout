import { Finding } from '../types';

const INFORMATIONAL_CATEGORIES = new Set([
  'STATIC_SCAN',
  'DEPENDENCY_ANALYSIS',
  'DEPENDENCY_AUDIT',
  'SEMgrep_INTEGRATION',
  'SEMgrep_PARSE'
]);

export const isInformationalFinding = (finding: Pick<Finding, 'category' | 'file'>) =>
  INFORMATIONAL_CATEGORIES.has(finding.category) || finding.file === 'N/A';

export const isChatEnabledForFinding = (finding: Finding) => !isInformationalFinding(finding);
