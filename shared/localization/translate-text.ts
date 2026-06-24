import { EXACT_PHRASES_UK } from './phrase-map';
import { AppLocale } from './locale';

const PATTERN_TRANSLATIONS: Array<{ pattern: RegExp; replace: string | ((...args: string[]) => string) }> = [
  {
    pattern: /^User-controlled data \((.+)\) may reach (.+)\.$/,
    replace: (_full, source, sink) =>
      `Дані під контролем користувача (${source}) можуть потрапити в ${sink}.`
  },
  {
    pattern: /^Update (.+) to (.+) or later\.$/,
    replace: (_full, pkg, version) => `Оновіть ${pkg} до ${version} або новішої версії.`
  },
  {
    pattern: /^Update (.+) to a secure version\.$/,
    replace: (_full, pkg) => `Оновіть ${pkg} до безпечної версії.`
  },
  {
    pattern: /^(.+): has a known vulnerability\.$/,
    replace: (_full, pkg) => `${pkg}: має відому вразливість.`
  }
];

export const translateText = (text: string, locale: AppLocale): string => {
  if (!text || locale === 'en') {
    return text;
  }

  const exact = EXACT_PHRASES_UK[text];
  if (exact) {
    return exact;
  }

  for (const { pattern, replace } of PATTERN_TRANSLATIONS) {
    const match = text.match(pattern);
    if (match) {
      return typeof replace === 'function'
        ? replace(...match)
        : text.replace(pattern, replace);
    }
  }

  return text;
};
