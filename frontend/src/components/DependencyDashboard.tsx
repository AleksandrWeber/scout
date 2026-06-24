import { DependencyPackageGroup } from '../utils/dependency-dashboard';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useLocalizedFinding } from '../hooks/useLocalizedFinding';
import { getSeverityBadgeStyle, normalizeSeverity } from '../constants/severity';
import { getSeverityLabel } from '@shared/localization';
import { Finding } from '../types';

interface Props {
  groups: DependencyPackageGroup[];
}

const DependencyFindingRow = ({ finding: rawFinding }: { finding: Finding }) => {
  const { colors, locale, t } = useAppPreferences();
  const finding = useLocalizedFinding(rawFinding);
  const details = finding.dependency;
  const severity = normalizeSeverity(finding.severity);
  const cveList =
    details?.cveIds && details.cveIds.length > 0 ? details.cveIds.join(', ') : t('noCveListed');

  return (
    <div
      style={{
        padding: 12,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: 10,
        background: colors.cardBg
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={getSeverityBadgeStyle(severity)}>{getSeverityLabel(severity, locale)}</span>
        {details?.exploitAvailable ? (
          <span style={{ fontSize: 12, color: colors.error, fontWeight: 600 }}>{t('exploitLikely')}</span>
        ) : null}
        {details?.priorityScore ? (
          <span style={{ fontSize: 12, color: colors.textMuted }}>
            {t('priority')} {details.priorityScore}
          </span>
        ) : null}
      </div>
      <p style={{ marginTop: 10, marginBottom: 8, color: colors.text }}>{finding.description}</p>
      <div style={{ fontSize: 14, color: colors.textSecondary, display: 'grid', gap: 6 }}>
        <div>
          <strong>{t('cve')}</strong> {cveList}
        </div>
        <div>
          <strong>{t('affected')}</strong> {details?.vulnerableVersions || t('unknownRange')}
        </div>
        <div>
          <strong>{t('fixedIn')}</strong> {details?.patchedVersion || t('seeNpmAdvisory')}
        </div>
        <div>
          <strong>{t('fix')}</strong> {finding.fix}
        </div>
      </div>
    </div>
  );
};

const DependencyDashboard = ({ groups }: Props) => {
  const { colors, locale, t } = useAppPreferences();

  if (groups.length === 0) {
    return <p style={{ marginTop: 16, color: colors.textMuted }}>{t('noDependencyVulns')}</p>;
  }

  return (
    <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
      {groups.map((group) => (
        <section
          key={group.packageName}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            background: colors.cardBgMuted
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong style={{ fontSize: 18 }}>{group.packageName}</strong>
              <div style={{ marginTop: 6, color: colors.textMuted, fontSize: 14 }}>
                {group.findings.length}{' '}
                {group.findings.length === 1 ? t('advisory') : t('advisories')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={getSeverityBadgeStyle(group.highestSeverity)}>
                {getSeverityLabel(group.highestSeverity, locale)}
              </span>
              {group.exploitAvailable ? (
                <span style={{ fontSize: 12, color: colors.error, fontWeight: 600 }}>{t('exploitLikely')}</span>
              ) : null}
              <span style={{ fontSize: 12, color: colors.textMuted }}>
                {t('priority')} {group.priorityScore}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {group.findings.map((finding, index) => (
              <DependencyFindingRow key={`${group.packageName}-${index}`} finding={finding} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default DependencyDashboard;
