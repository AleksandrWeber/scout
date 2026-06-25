import type { GeneratedReport } from '@shared/reports';

export const downloadReportHtml = (report: GeneratedReport): void => {
  const blob = new Blob([report.html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = report.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const openReportPrintView = (report: GeneratedReport): void => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');

  if (!printWindow) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(report.html);
  printWindow.document.close();
  printWindow.focus();

  window.setTimeout(() => {
    printWindow.print();
  }, 300);
};

export const copyReportSummary = async (report: GeneratedReport): Promise<void> => {
  await navigator.clipboard.writeText(report.plainText);
};

export const shareReportNatively = async (report: GeneratedReport): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  const file = new File([report.html], report.fileName, { type: 'text/html' });

  const shareData: ShareData = {
    title: report.title,
    text: report.plainText
  };

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ ...shareData, files: [file] });
    return true;
  }

  await navigator.share(shareData);
  return true;
};
