import { SCOUT_AGENT_LABELS, type AgentsReviewMeta } from '@shared/agents';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatTranslation } from '../i18n/translations';

interface Props {
  review: AgentsReviewMeta;
}

const agentLabel = (id: 'supply-chain' | 'code-security' | 'synthesis', locale: 'en' | 'uk') => {
  if (id === 'synthesis') {
    return locale === 'uk' ? 'Синтез' : 'Synthesis';
  }

  return SCOUT_AGENT_LABELS[id][locale];
};

const AgentsReviewPanel = ({ review }: Props) => {
  const { colors, locale, t } = useAppPreferences();

  return (
    <section
      style={{
        marginTop: 16,
        padding: 16,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        background: colors.cardBg
      }}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>{t('agentsReviewTitle')}</h2>
      <p style={{ margin: '0 0 16px', color: colors.textMuted, fontSize: 14 }}>{t('agentsReviewHint')}</p>

      <div style={{ display: 'grid', gap: 10 }}>
        {review.agents.map((agent) => (
          <div
            key={agent.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              padding: 12,
              borderRadius: 10,
              background: colors.cardBgMuted,
              border: `1px solid ${colors.borderLight}`
            }}
          >
            <div>
              <strong>{agentLabel(agent.id, locale)}</strong>
              <div style={{ marginTop: 4, color: colors.textSecondary, fontSize: 14 }}>
                {formatTranslation(t('agentFindingsCount'), { count: agent.findingsCount })} · {agent.durationMs}ms
              </div>
              {agent.message ? (
                <div style={{ marginTop: 4, color: colors.errorMuted, fontSize: 13 }}>{agent.message}</div>
              ) : null}
            </div>
            <span
              style={{
                alignSelf: 'flex-start',
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 999,
                background: agent.status === 'success' ? colors.toggleActiveBg : colors.cardBg,
                color: agent.status === 'success' ? colors.toggleActiveText : colors.textMuted,
                border: `1px solid ${colors.borderLight}`
              }}
            >
              {agent.status === 'success' ? t('agentStatusSuccess') : t('agentStatusFailed')}
            </span>
          </div>
        ))}
      </div>

      {review.synthesis ? (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.borderLight}` }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{t('agentsSynthesisTitle')}</h3>
          <p style={{ marginTop: 0 }}>{review.synthesis.overview}</p>
          <p style={{ margin: '12px 0 6px' }}>
            <strong>{t('agentsSynthesisPriorities')}</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {review.synthesis.priorities.map((priority) => (
              <li key={priority} style={{ marginBottom: 6 }}>
                {priority}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>
            {review.synthesis.consensusNote}
          </p>
        </div>
      ) : null}
    </section>
  );
};

export default AgentsReviewPanel;
