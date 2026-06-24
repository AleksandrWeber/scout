import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  formatTranslation,
  Locale,
  TranslationKey,
  translations
} from '../i18n/translations';
import {
  applyDocumentPreferences,
  persistLocale,
  persistTheme,
  readStoredLocale,
  readStoredTheme
} from '../preferences/storage';
import { getThemeColors, ThemeColors, ThemeMode } from '../theme/colors';

interface AppPreferencesContextValue {
  locale: Locale;
  theme: ThemeMode;
  colors: ThemeColors;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeMode) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export const AppPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    persistTheme(nextTheme);
  }, []);

  const colors = useMemo(() => getThemeColors(theme), [theme]);

  useEffect(() => {
    applyDocumentPreferences(locale, theme);
    document.body.style.background = colors.pageBg;
    document.body.style.color = colors.text;
  }, [locale, theme, colors.pageBg, colors.text]);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) =>
      formatTranslation(translations[locale][key], values),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, theme, colors, setLocale, setTheme, t }),
    [locale, theme, colors, setLocale, setTheme, t]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
};

export const useAppPreferences = (): AppPreferencesContextValue => {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }
  return context;
};
