import { FormEvent, useState } from 'react';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { ChatMessage, Finding } from '../types';
import { sendSecurityChatMessage } from '../services/api';

interface Props {
  finding: Finding;
}

const FindingChatPanel = ({ finding }: Props) => {
  const { colors, t } = useAppPreferences();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendSecurityChatMessage({
        finding,
        message: trimmed,
        history: messages
      });
      setMessages([...nextMessages, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setError((err as Error).message);
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        background: colors.chatPanelBg
      }}
    >
      <strong>{t('askScout')}</strong>
      <div style={{ marginTop: 12, display: 'grid', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>{t('chatHint')}</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                padding: '8px 12px',
                borderRadius: 10,
                background: message.role === 'user' ? colors.chatUserBg : colors.chatAssistantBg,
                color: message.role === 'user' ? colors.chatUserText : colors.chatAssistantText,
                fontSize: 14,
                whiteSpace: 'pre-wrap'
              }}
            >
              {message.content}
            </div>
          ))
        )}
      </div>
      {error ? <p style={{ marginTop: 8, color: colors.error, fontSize: 14 }}>{error}</p> : null}
      <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('chatPlaceholder')}
          disabled={loading}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${colors.inputBorder}`,
            background: colors.inputBg,
            color: colors.text
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: '10px 14px', borderRadius: 8 }}>
          {loading ? t('sending') : t('send')}
        </button>
      </form>
    </div>
  );
};

export default FindingChatPanel;
