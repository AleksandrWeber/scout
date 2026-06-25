export const buildMailtoLink = (options: {
  subject: string;
  body: string;
}): string => {
  const params = new URLSearchParams({
    subject: options.subject,
    body: options.body
  });

  return `mailto:?${params.toString()}`;
};

export const buildTelegramShareLink = (text: string): string => {
  const params = new URLSearchParams({ text });
  return `https://t.me/share/url?${params.toString()}`;
};

export const buildWhatsAppShareLink = (text: string): string => {
  const params = new URLSearchParams({ text });
  return `https://wa.me/?${params.toString()}`;
};

export const truncateForMessenger = (text: string, maxLength = 900): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
};
