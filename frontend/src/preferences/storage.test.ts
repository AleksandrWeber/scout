import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  LOCALE_STORAGE_KEY,
  persistLocale,
  persistTheme,
  readStoredLocale,
  readStoredTheme,
  THEME_STORAGE_KEY
} from './storage';

describe('preferences storage', () => {
  it('uses English and light theme on first visit', () => {
    expect(readStoredLocale()).toBe(DEFAULT_LOCALE);
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('persists language independently from theme', () => {
    persistLocale('uk');

    expect(readStoredLocale()).toBe('uk');
    expect(readStoredTheme()).toBe('light');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('uk');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('persists theme independently from language', () => {
    persistTheme('dark');

    expect(readStoredLocale()).toBe('en');
    expect(readStoredTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
  });

  it('restores both saved preferences on reload', () => {
    persistLocale('uk');
    persistTheme('dark');

    expect(readStoredLocale()).toBe('uk');
    expect(readStoredTheme()).toBe('dark');
  });

  it('falls back to defaults for invalid stored values', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');

    expect(readStoredLocale()).toBe('en');
    expect(readStoredTheme()).toBe('light');
  });
});
