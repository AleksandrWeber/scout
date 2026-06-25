import type { AppLocale } from '../localization';

export const formatScanTimestamp = (iso: string, locale: AppLocale): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const tag = locale === 'uk' ? 'uk-UA' : 'en-GB';

  return new Intl.DateTimeFormat(tag, {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date);
};
