import { useMemo } from 'react';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { getCategoryLabel } from '../i18n/category-labels';
import { TranslationKey } from '../i18n/translations';
import { FindingsFilters, GroupByOption } from '../utils/findings-filters';
import { FindingSeverity } from '../types';

interface Props {
  filters: FindingsFilters;
  categories: string[];
  filteredCount: number;
  totalCount: number;
  onChange: (next: FindingsFilters) => void;
}

const FindingsToolbar = ({ filters, categories, filteredCount, totalCount, onChange }: Props) => {
  const { colors, locale, t } = useAppPreferences();
  const update = (patch: Partial<FindingsFilters>) => onChange({ ...filters, ...patch });

  const groupOptions = useMemo(
    (): Array<{ value: GroupByOption; labelKey: TranslationKey }> => [
      { value: 'severity', labelKey: 'groupSeverity' },
      { value: 'category', labelKey: 'groupCategory' },
      { value: 'file', labelKey: 'groupFile' },
      { value: 'none', labelKey: 'groupNone' }
    ],
    []
  );

  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        display: 'grid',
        gap: 12,
        background: colors.cardBg
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <strong>{t('findingsExplorer')}</strong>
        <span style={{ color: colors.textMuted }}>
          {t('showingCount', { filtered: filteredCount, total: totalCount })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{t('search')}</span>
          <input
            type="search"
            value={filters.search}
            placeholder={t('searchPlaceholder')}
            onChange={(event) => update({ search: event.target.value })}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
              color: colors.text
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{t('severity')}</span>
          <select
            value={filters.severity}
            onChange={(event) => update({ severity: event.target.value as FindingsFilters['severity'] })}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
              color: colors.text
            }}
          >
            <option value="ALL">{t('allSeverities')}</option>
            {(['HIGH', 'MEDIUM', 'LOW'] as FindingSeverity[]).map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{t('category')}</span>
          <select
            value={filters.category}
            onChange={(event) => update({ category: event.target.value })}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
              color: colors.text
            }}
          >
            <option value="ALL">{t('allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {getCategoryLabel(category, locale)}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{t('groupBy')}</span>
          <select
            value={filters.groupBy}
            onChange={(event) => update({ groupBy: event.target.value as GroupByOption })}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
              color: colors.text
            }}
          >
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default FindingsToolbar;
