import { isChatEnabledForFinding, isInformationalFinding } from './finding-chat';
import { Finding } from '../types';

const staticFinding: Finding = {
  category: 'STATIC_SCAN',
  file: 'N/A',
  severity: 'LOW',
  description: 'No security patterns were detected.',
  risk: 'Deeper analysis may still be needed.',
  fix: 'Integrate Semgrep.',
  education: 'Informational only.'
};

const xssFinding: Finding = {
  category: 'XSS',
  file: 'src/App.tsx',
  severity: 'HIGH',
  description: 'Uses dangerouslySetInnerHTML.',
  risk: 'Script injection.',
  fix: 'Sanitize output.',
  education: 'XSS basics.'
};

describe('finding-chat utils', () => {
  it('treats STATIC_SCAN as informational', () => {
    expect(isInformationalFinding(staticFinding)).toBe(true);
    expect(isChatEnabledForFinding(staticFinding)).toBe(false);
  });

  it('enables chat for real vulnerability findings', () => {
    expect(isChatEnabledForFinding(xssFinding)).toBe(true);
  });
});
