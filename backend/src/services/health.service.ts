import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type HealthStatus = {
  status: 'ok';
  service: string;
  uptimeSeconds: number;
  timestamp: string;
  version: string;
};

export type ReadyStatus = {
  status: 'ready' | 'degraded';
  checks: {
    semgrep: 'ok' | 'unavailable';
    aiProvider: 'gemini' | 'openai' | 'local';
  };
  timestamp: string;
};

export type MetricsSnapshot = {
  uptimeSeconds: number;
  requestsTotal: number;
  analyzeRequestsTotal: number;
  analyzeErrorsTotal: number;
  timestamp: string;
};

export const isSemgrepAvailable = async (): Promise<boolean> => {
  try {
    await execFileAsync('semgrep', ['--version']);
    return true;
  } catch {
    return false;
  }
};

export const resolveAiProvider = (): 'gemini' | 'openai' | 'local' => {
  const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();

  if (provider === 'gemini') {
    return process.env.GEMINI_API_KEY ? 'gemini' : 'local';
  }
  if (provider === 'openai') {
    return process.env.OPENAI_API_KEY ? 'openai' : 'local';
  }
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'local';
};

export const getHealthStatus = (): HealthStatus => ({
  status: 'ok',
  service: 'scout-backend',
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || '0.1.0'
});

export const getReadyStatus = async (): Promise<ReadyStatus> => {
  const semgrepAvailable = await isSemgrepAvailable();

  return {
    status: semgrepAvailable ? 'ready' : 'degraded',
    checks: {
      semgrep: semgrepAvailable ? 'ok' : 'unavailable',
      aiProvider: resolveAiProvider()
    },
    timestamp: new Date().toISOString()
  };
};
