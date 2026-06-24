import { AppLocale } from './locale';

const CATEGORY_LABELS_UK: Record<string, string> = {
  XSS: 'XSS',
  CODE_INJECTION: "Ін'єкція коду",
  AST_DATA_FLOW: 'Потік даних (AST)',
  DEPENDENCY_VULNERABILITY: 'Вразливість залежності',
  DEPENDENCY_ANALYSIS: 'Аналіз залежностей',
  DEPENDENCY_AUDIT: 'Аудит залежностей',
  SECRET: 'Секрети в коді',
  SEMGREP_INTEGRATION: 'Semgrep',
  SEMGREP_PARSE: 'Semgrep',
  STATIC_SCAN: 'Статичне сканування'
};

export const getCategoryLabel = (category: string, locale: AppLocale): string => {
  if (locale === 'uk') {
    return CATEGORY_LABELS_UK[category] ?? category.replace(/_/g, ' ');
  }

  return category.replace(/_/g, ' ');
};
