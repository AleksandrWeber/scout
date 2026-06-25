import { useMemo, useState, type CSSProperties } from 'react';
import {
  buildMailtoLink,
  buildReport,
  buildTelegramShareLink,
  buildWhatsAppShareLink,
  formatScanTimestamp,
  truncateForMessenger,
  type GeneratedReport,
  type ReportBuildInput,
  type ReportKind
} from '@shared/reports';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { fetchExecutiveNarrative } from '../services/api';
import {
  copyReportSummary,
  downloadReportHtml,
  openReportPrintView,
  shareReportNatively
} from '../utils/report-export';

type ReportFlowModalProps = {
  open: boolean;
  input: ReportBuildInput | null;
  onClose: () => void;
};

type Step = 'choose' | 'preview';

const ReportFlowModal = ({ open, input, onClose }: ReportFlowModalProps) => {
  const { colors, t } = useAppPreferences();
  const [step, setStep] = useState<Step>('choose');
  const [selectedKind, setSelectedKind] = useState<ReportKind>('technical');
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const messengerText = useMemo(() => {
    if (!report || !input) {
      return '';
    }

    return truncateForMessenger(
      [
        report.title,
        `${t('reportProject')}: ${input.projectName}`,
        `${t('reportScannedAt')}: ${formatScanTimestamp(input.scannedAt, input.locale)}`,
        '',
        report.plainText
      ].join('\n')
    );
  }, [input, report, t]);

  if (!open || !input) {
    return null;
  }

  const resetAndClose = () => {
    setStep('choose');
    setSelectedKind('technical');
    setReport(null);
    setStatusMessage(null);
    setErrorMessage(null);
    onClose();
  };

  const handleGenerate = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setGenerating(true);

    try {
      let buildInput = input;

      if (selectedKind === 'executive') {
        const response = await fetchExecutiveNarrative(input);
        buildInput = {
          ...input,
          executiveNarrative: response.narrative
        };
      }

      const generated = buildReport(selectedKind, buildInput);
      setReport(generated);
      setStep('preview');
    } catch {
      setErrorMessage(t('reportGenerateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const runAction = async (action: () => void | Promise<void>, successLabel: string) => {
    try {
      setErrorMessage(null);
      await action();
      setStatusMessage(successLabel);
    } catch {
      setErrorMessage(t('reportActionFailed'));
    }
  };

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000
  };

  const panelStyle: CSSProperties = {
    width: 'min(920px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: colors.cardBg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 20
  };

  const buttonStyle: CSSProperties = {
    border: `1px solid ${colors.border}`,
    background: colors.cardBgMuted,
    color: colors.text,
    borderRadius: 10,
    padding: '10px 14px',
    cursor: 'pointer'
  };

  const primaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    background: colors.toggleActiveBg,
    color: colors.toggleActiveText,
    borderColor: colors.toggleActiveBg
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={t('reportGenerateTitle')}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{step === 'choose' ? t('reportGenerateTitle') : t('reportPreviewTitle')}</h2>
          <button type="button" onClick={resetAndClose} style={buttonStyle}>
            {t('reportClose')}
          </button>
        </div>

        {step === 'choose' ? (
          <>
            <p style={{ color: colors.textMuted }}>{t('reportGenerateHint')}</p>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="radio"
                  name="report-kind"
                  checked={selectedKind === 'technical'}
                  onChange={() => setSelectedKind('technical')}
                />
                <span>
                  <strong>{t('reportTechnicalOption')}</strong>
                  <div style={{ color: colors.textMuted }}>{t('reportTechnicalHint')}</div>
                </span>
              </label>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="radio"
                  name="report-kind"
                  checked={selectedKind === 'executive'}
                  onChange={() => setSelectedKind('executive')}
                />
                <span>
                  <strong>{t('reportExecutiveOption')}</strong>
                  <div style={{ color: colors.textMuted }}>{t('reportExecutiveHint')}</div>
                </span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button type="button" onClick={handleGenerate} style={primaryButtonStyle} disabled={generating}>
                {generating ? t('reportGenerating') : t('reportGenerateAction')}
              </button>
              <button type="button" onClick={resetAndClose} style={buttonStyle}>
                {t('reportCancel')}
              </button>
            </div>
          </>
        ) : (
          <>
            {report ? (
              <>
                <p style={{ color: colors.textMuted, marginBottom: 12 }}>
                  {t('reportProject')}: <strong>{input.projectName}</strong>
                </p>
                <iframe
                  title={report.title}
                  srcDoc={report.html}
                  style={{
                    width: '100%',
                    minHeight: 360,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    background: '#fff'
                  }}
                />
                <h3 style={{ marginTop: 20 }}>{t('reportShareTitle')}</h3>
                <p style={{ color: colors.textMuted }}>{t('reportShareHint')}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => runAction(() => downloadReportHtml(report), t('reportDownloaded'))}
                  >
                    {t('reportDownloadHtml')}
                  </button>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => runAction(() => openReportPrintView(report), t('reportPrintOpened'))}
                  >
                    {t('reportPrintPdf')}
                  </button>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => runAction(() => copyReportSummary(report), t('reportCopied'))}
                  >
                    {t('reportCopySummary')}
                  </button>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() =>
                      runAction(async () => {
                        const shared = await shareReportNatively(report);
                        if (!shared) {
                          throw new Error('share unavailable');
                        }
                      }, t('reportShared'))
                    }
                  >
                    {t('reportNativeShare')}
                  </button>
                  <a
                    href={buildMailtoLink({
                      subject: `${report.title} — ${input.projectName}`,
                      body: messengerText
                    })}
                    style={{ ...buttonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    {t('reportEmail')}
                  </a>
                  <a
                    href={buildTelegramShareLink(messengerText)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...buttonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    {t('reportTelegram')}
                  </a>
                  <a
                    href={buildWhatsAppShareLink(messengerText)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...buttonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    {t('reportWhatsApp')}
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep('choose')} style={buttonStyle}>
                    {t('reportBack')}
                  </button>
                  <button type="button" onClick={resetAndClose} style={primaryButtonStyle}>
                    {t('reportDone')}
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}

        {statusMessage ? <p style={{ color: colors.textSecondary, marginTop: 16 }}>{statusMessage}</p> : null}
        {errorMessage ? <p style={{ color: colors.error, marginTop: 16 }}>{errorMessage}</p> : null}
      </div>
    </div>
  );
};

export default ReportFlowModal;
