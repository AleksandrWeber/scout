export type AppLocale = 'en' | 'uk';

export const DEFAULT_LOCALE: AppLocale = 'en';

export const normalizeLocale = (value: unknown): AppLocale => (value === 'uk' ? 'uk' : 'en');
