import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export type SharedReportRecord = {
  token: string;
  title: string;
  html: string;
  createdAt: string;
  expiresAt: string;
};

const DEFAULT_TTL_HOURS = 72;
const MAX_SHARE_HTML_BYTES = 2 * 1024 * 1024;

const getShareDirectory = () => path.join(os.tmpdir(), 'scout-shared-reports');

const getTtlHours = (): number => {
  const raw = Number(process.env.REPORT_SHARE_TTL_HOURS || DEFAULT_TTL_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_HOURS;
};

const getRecordPath = (token: string) => path.join(getShareDirectory(), `${token}.json`);

const isValidToken = (token: string) => /^[a-f0-9-]{36}$/i.test(token);

const ensureShareDirectory = async () => {
  await fs.mkdir(getShareDirectory(), { recursive: true });
};

const readRecord = async (token: string): Promise<SharedReportRecord | null> => {
  try {
    const raw = await fs.readFile(getRecordPath(token), 'utf8');
    return JSON.parse(raw) as SharedReportRecord;
  } catch {
    return null;
  }
};

const deleteRecord = async (token: string) => {
  try {
    await fs.unlink(getRecordPath(token));
  } catch {
    // ignore missing files
  }
};

export const cleanupExpiredSharedReports = async () => {
  await ensureShareDirectory();
  const entries = await fs.readdir(getShareDirectory(), { withFileTypes: true });
  const now = Date.now();

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const token = entry.name.replace(/\.json$/, '');
        const record = await readRecord(token);
        if (!record || Date.parse(record.expiresAt) <= now) {
          await deleteRecord(token);
        }
      })
  );
};

export const createSharedReport = async (input: {
  html: string;
  title: string;
}): Promise<{ token: string; expiresAt: string; sharePath: string }> => {
  const html = input.html?.trim();
  const title = input.title?.trim() || 'Scout report';

  if (!html) {
    throw new Error('html is required');
  }

  if (Buffer.byteLength(html, 'utf8') > MAX_SHARE_HTML_BYTES) {
    throw new Error('Report is too large to share');
  }

  await cleanupExpiredSharedReports();
  await ensureShareDirectory();

  const token = crypto.randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + getTtlHours() * 60 * 60 * 1000);

  const record: SharedReportRecord = {
    token,
    title,
    html,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  await fs.writeFile(getRecordPath(token), JSON.stringify(record), 'utf8');

  return {
    token,
    expiresAt: record.expiresAt,
    sharePath: `/api/reports/shared/${token}`
  };
};

export const getSharedReport = async (token: string): Promise<SharedReportRecord | null> => {
  if (!isValidToken(token)) {
    return null;
  }

  const record = await readRecord(token);
  if (!record) {
    return null;
  }

  if (Date.parse(record.expiresAt) <= Date.now()) {
    await deleteRecord(token);
    return null;
  }

  return record;
};

export const __test__ = {
  getShareDirectory,
  deleteRecord,
  isValidToken,
  MAX_SHARE_HTML_BYTES
};
