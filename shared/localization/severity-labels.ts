import { AppLocale } from './locale';

export const SEVERITY_LABELS: Record<AppLocale, Record<'HIGH' | 'MEDIUM' | 'LOW', string>> = {
  en: { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' },
  uk: { HIGH: 'ВИСОКИЙ', MEDIUM: 'СЕРЕДНІЙ', LOW: 'НИЗЬКИЙ' }
};

export const getSeverityLabel = (severity: string, locale: AppLocale): string => {
  const key = severity.toUpperCase();
  if (key === 'HIGH' || key === 'MEDIUM' || key === 'LOW') {
    return SEVERITY_LABELS[locale][key];
  }
  return severity;
};
