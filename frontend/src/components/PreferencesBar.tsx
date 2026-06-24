import { useAppPreferences } from '../context/AppPreferencesContext';
import { Locale } from '../i18n/translations';
import { ThemeMode } from '../theme/colors';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

const SegmentedToggle = <T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
}) => {
  const { colors } = useAppPreferences();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: colors.textMuted }}>{label}</span>
      <div
        role="group"
        aria-label={label}
        style={{
          display: 'inline-flex',
          border: `1px solid ${colors.toggleBorder}`,
          borderRadius: 999,
          overflow: 'hidden',
          background: colors.toggleInactiveBg
        }}
      >
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              style={{
                padding: '6px 12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: isActive ? colors.toggleActiveBg : 'transparent',
                color: isActive ? colors.toggleActiveText : colors.toggleInactiveText
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PreferencesBar = () => {
  const { locale, theme, setLocale, setTheme, t } = useAppPreferences();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}
    >
      <SegmentedToggle<Locale>
        label={t('preferencesLanguage')}
        value={locale}
        options={[
          { value: 'en', label: t('languageEn') },
          { value: 'uk', label: t('languageUk') }
        ]}
        onChange={setLocale}
      />
      <SegmentedToggle<ThemeMode>
        label={t('preferencesTheme')}
        value={theme}
        options={[
          { value: 'light', label: t('themeLight') },
          { value: 'dark', label: t('themeDark') }
        ]}
        onChange={setTheme}
      />
    </div>
  );
};

export default PreferencesBar;
