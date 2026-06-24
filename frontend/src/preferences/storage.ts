import { Locale } from '../i18n/translations';
import { ThemeMode } from '../theme/colors';

export const LOCALE_STORAGE_KEY = 'scout-locale';
export const THEME_STORAGE_KEY = 'scout-theme';

const isLocale = (value: string | null): value is Locale => value === 'en' || value === 'uk';
const isTheme = (value: string | null): value is ThemeMode => value === 'light' || value === 'dark';

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore quota / private-mode errors and keep in-memory state only.
  }
};

export const DEFAULT_LOCALE: Locale = 'en';
export const DEFAULT_THEME: ThemeMode = 'light';

export const readStoredLocale = (): Locale => {
  const stored = readStorage(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
};

export const readStoredTheme = (): ThemeMode => {
  const stored = readStorage(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : DEFAULT_THEME;
};

export const persistLocale = (locale: Locale): void => {
  writeStorage(LOCALE_STORAGE_KEY, locale);
};

export const persistTheme = (theme: ThemeMode): void => {
  writeStorage(THEME_STORAGE_KEY, theme);
};

export const applyDocumentPreferences = (locale: Locale, theme: ThemeMode): void => {
  document.documentElement.lang = locale === 'uk' ? 'uk' : 'en';
  document.documentElement.dataset.theme = theme;
};
