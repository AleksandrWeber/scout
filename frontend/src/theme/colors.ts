export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  pageBg: string;
  cardBg: string;
  cardBgMuted: string;
  cardBgSubtle: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  error: string;
  errorMuted: string;
  chatPanelBg: string;
  chatUserBg: string;
  chatUserText: string;
  chatAssistantBg: string;
  chatAssistantText: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveBg: string;
  tabInactiveText: string;
  tabInactiveBorder: string;
  tabActiveBorder: string;
  severityCardBg: string;
  severityCardInactiveBorder: string;
  severityCardText: string;
  codeBg: string;
  preferencesBarBorder: string;
  toggleActiveBg: string;
  toggleActiveText: string;
  toggleInactiveBg: string;
  toggleInactiveText: string;
  toggleBorder: string;
  semgrepMessage: string;
}

export const lightColors: ThemeColors = {
  pageBg: '#ffffff',
  cardBg: '#ffffff',
  cardBgMuted: '#f9fafb',
  cardBgSubtle: '#f3f4f6',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  text: '#111827',
  textMuted: '#6b7280',
  textSecondary: '#374151',
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  buttonSecondaryBg: '#ffffff',
  buttonSecondaryText: '#374151',
  error: '#b91c1c',
  errorMuted: '#7f1d1d',
  chatPanelBg: '#f3f4f6',
  chatUserBg: '#111827',
  chatUserText: '#ffffff',
  chatAssistantBg: '#ffffff',
  chatAssistantText: '#111827',
  tabActiveBg: '#111827',
  tabActiveText: '#ffffff',
  tabInactiveBg: '#ffffff',
  tabInactiveText: '#374151',
  tabInactiveBorder: '#d1d5db',
  tabActiveBorder: '#111827',
  severityCardBg: '#ffffff',
  severityCardInactiveBorder: '#e5e7eb',
  severityCardText: '#111827',
  codeBg: '#ffffff',
  preferencesBarBorder: '#e5e7eb',
  toggleActiveBg: '#111827',
  toggleActiveText: '#ffffff',
  toggleInactiveBg: '#ffffff',
  toggleInactiveText: '#374151',
  toggleBorder: '#d1d5db',
  semgrepMessage: '#374151'
};

export const darkColors: ThemeColors = {
  pageBg: '#0f172a',
  cardBg: '#1e293b',
  cardBgMuted: '#1e293b',
  cardBgSubtle: '#334155',
  border: '#334155',
  borderLight: '#475569',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textSecondary: '#cbd5e1',
  inputBg: '#0f172a',
  inputBorder: '#475569',
  buttonSecondaryBg: '#1e293b',
  buttonSecondaryText: '#e2e8f0',
  error: '#f87171',
  errorMuted: '#fecaca',
  chatPanelBg: '#334155',
  chatUserBg: '#f1f5f9',
  chatUserText: '#0f172a',
  chatAssistantBg: '#1e293b',
  chatAssistantText: '#f1f5f9',
  tabActiveBg: '#f1f5f9',
  tabActiveText: '#0f172a',
  tabInactiveBg: '#1e293b',
  tabInactiveText: '#cbd5e1',
  tabInactiveBorder: '#475569',
  tabActiveBorder: '#f1f5f9',
  severityCardBg: '#1e293b',
  severityCardInactiveBorder: '#475569',
  severityCardText: '#f1f5f9',
  codeBg: '#0f172a',
  preferencesBarBorder: '#334155',
  toggleActiveBg: '#f1f5f9',
  toggleActiveText: '#0f172a',
  toggleInactiveBg: '#1e293b',
  toggleInactiveText: '#cbd5e1',
  toggleBorder: '#475569',
  semgrepMessage: '#cbd5e1'
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === 'dark' ? darkColors : lightColors;
