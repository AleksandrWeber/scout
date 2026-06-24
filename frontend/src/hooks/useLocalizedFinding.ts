import { useMemo } from 'react';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { Finding } from '../types';
import { localizeFinding } from '@shared/localization';

export const useLocalizedFinding = (finding: Finding): Finding => {
  const { locale } = useAppPreferences();

  return useMemo(() => localizeFinding(finding, locale), [finding, locale]);
};
