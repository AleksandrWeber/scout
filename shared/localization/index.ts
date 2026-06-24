export type { AppLocale } from './locale';
export { DEFAULT_LOCALE, normalizeLocale } from './locale';
export { getCategoryLabel } from './category-labels';
export { getSeverityLabel, SEVERITY_LABELS } from './severity-labels';
export { translateText } from './translate-text';
export {
  buildLocalizedAiExplanation,
  localizeAiExplanation,
  type LocalizedAiExplanation
} from './ai-explanations';
export { localizeFinding, localizeFindings, type LocalizableFinding } from './localize-finding';
