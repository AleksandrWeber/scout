import VulnerabilityCard from './VulnerabilityCard';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { getCategoryLabel } from '../i18n/category-labels';
import { Finding, FindingSeverity } from '../types';
import { getSeverityBadgeStyle } from '../constants/severity';
import { getSeverityLabel } from '@shared/localization';

interface Props {
  groups: Array<{ key: string; label: string; findings: Finding[] }>;
  groupBy: 'none' | 'severity' | 'category' | 'file';
}

const FindingsList = ({ groups, groupBy }: Props) => {
  const { colors, locale, t } = useAppPreferences();

  if (groups.every((group) => group.findings.length === 0)) {
    return <p style={{ marginTop: 16, color: colors.textMuted }}>{t('noFilteredFindings')}</p>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      {groups.map((group) => (
        <section key={group.key} style={{ marginBottom: 24 }}>
          {groupBy !== 'none' ? (
            <header
              style={{
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center'
              }}
            >
              {groupBy === 'severity' ? (
                <span style={getSeverityBadgeStyle(group.key as FindingSeverity)}>
                  {getSeverityLabel(group.key as FindingSeverity, locale)}
                </span>
              ) : (
                <strong>{groupBy === 'category' ? getCategoryLabel(group.label, locale) : group.label}</strong>
              )}
              <span style={{ color: colors.textMuted }}>
                {t('findingCount', { count: group.findings.length })}
              </span>
            </header>
          ) : null}

          {group.findings.map((finding, index) => (
            <VulnerabilityCard key={`${group.key}-${finding.file}-${finding.line ?? 'na'}-${index}`} finding={finding} />
          ))}
        </section>
      ))}
    </div>
  );
};

export default FindingsList;
