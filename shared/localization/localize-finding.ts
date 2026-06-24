import { localizeAiExplanation, LocalizedAiExplanation } from './ai-explanations';
import { AppLocale } from './locale';
import { translateText } from './translate-text';

export interface LocalizableFinding {
  severity: string;
  category: string;
  file: string;
  line?: number;
  description: string;
  risk: string;
  fix: string;
  education: string;
  aiExplanation?: LocalizedAiExplanation;
  dependency?: Record<string, unknown>;
}

export const localizeFinding = <T extends LocalizableFinding>(finding: T, locale: AppLocale): T => {
  if (locale === 'en') {
    return finding;
  }

  return {
    ...finding,
    description: translateText(finding.description, locale),
    risk: translateText(finding.risk, locale),
    fix: translateText(finding.fix, locale),
    education: translateText(finding.education, locale),
    aiExplanation: localizeAiExplanation(
      finding as Record<string, unknown>,
      finding.aiExplanation,
      locale
    )
  };
};

export const localizeFindings = <T extends LocalizableFinding>(findings: T[], locale: AppLocale): T[] =>
  findings.map((finding) => localizeFinding(finding, locale));
