import axios from 'axios';
import OpenAI from 'openai';
import {
  buildSecurityChatPrompt,
  SECURITY_CHAT_PROMPT_VERSION,
  SecurityChatTurn
} from '../prompts/security-chat.prompt';
import { resolveProvider, scheduleAiRequest } from './ai.service';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const MAX_HISTORY_TURNS = 6;

export type SecurityChatRequest = {
  finding: Record<string, unknown>;
  message: string;
  history?: SecurityChatTurn[];
};

export type SecurityChatResponse = {
  reply: string;
  provider: 'gemini' | 'openai' | 'local';
};

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
  return `{${entries.join(',')}}`;
};

const buildChatCacheKey = (request: SecurityChatRequest) =>
  stableStringify({
    promptVersion: SECURITY_CHAT_PROMPT_VERSION,
    finding: {
      severity: request.finding.severity,
      category: request.finding.category,
      file: request.finding.file,
      line: request.finding.line,
      description: request.finding.description,
      risk: request.finding.risk,
      fix: request.finding.fix
    },
    message: request.message.trim(),
    history: (request.history || []).slice(-MAX_HISTORY_TURNS)
  });

const chatCache = new Map<string, SecurityChatResponse>();
const chatInFlight = new Map<string, Promise<SecurityChatResponse>>();

const normalizeHistory = (history: SecurityChatTurn[] = []) => history.slice(-MAX_HISTORY_TURNS);

export const buildLocalSecurityChatReply = (
  finding: Record<string, unknown>,
  message: string
): string => {
  const category = (finding.category || 'security issue').toString();
  const file = (finding.file || 'the affected file').toString();
  const fix = (finding.fix || 'Review the flagged code and apply a secure pattern.').toString();
  const lower = message.toLowerCase();

  if (lower.includes('why') || lower.includes('чому')) {
    return `${category} in ${file} is risky because untrusted input or unsafe APIs can change how your app behaves. ${finding.risk || 'An attacker may abuse this pattern.'}`;
  }

  if (lower.includes('fix') || lower.includes('how') || lower.includes('як')) {
    return `Start in ${file}: ${fix} Then re-run the scan to confirm the finding is gone.`;
  }

  if (lower.includes('example') || lower.includes('code')) {
    const sample = (finding.aiExplanation as { codeSample?: string } | undefined)?.codeSample;
    if (sample) {
      return `Here is a direction to explore:\n${sample}`;
    }
    return `Focus on ${category} in ${file}. Replace the unsafe pattern with validated input handling and safe rendering APIs.`;
  }

  return `This ${category} finding in ${file} needs attention. Ask me "how do I fix this?" or "why is this dangerous?" and I will walk you through it. Suggested direction: ${fix}`;
};

const generateChatWithGemini = async (
  finding: Record<string, unknown>,
  message: string,
  history: SecurityChatTurn[]
): Promise<string | null> => {
  if (!GEMINI_API_KEY) return null;

  const prompt = buildSecurityChatPrompt(finding, message, history);
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await scheduleAiRequest(() =>
    axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5 }
      },
      { timeout: 30_000 }
    )
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
};

const generateChatWithOpenAi = async (
  finding: Record<string, unknown>,
  message: string,
  history: SecurityChatTurn[]
): Promise<string | null> => {
  if (!openaiClient || !OPENAI_API_KEY) return null;

  const prompt = buildSecurityChatPrompt(finding, message, history);
  const resp = await scheduleAiRequest(() =>
    openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    })
  );

  return resp.choices?.[0]?.message?.content?.trim() || null;
};

export const generateSecurityChatReply = async (
  request: SecurityChatRequest
): Promise<SecurityChatResponse> => {
  const message = request.message.trim();
  const history = normalizeHistory(request.history);
  const cacheKey = buildChatCacheKey({ ...request, message, history });

  if (chatCache.has(cacheKey)) {
    return chatCache.get(cacheKey)!;
  }

  if (chatInFlight.has(cacheKey)) {
    return chatInFlight.get(cacheKey)!;
  }

  const executor = async () => {
    const provider = resolveProvider();
    let reply = buildLocalSecurityChatReply(request.finding, message);
    let usedProvider: SecurityChatResponse['provider'] = 'local';

    try {
      if (provider === 'gemini') {
        const geminiReply = await generateChatWithGemini(request.finding, message, history);
        if (geminiReply) {
          reply = geminiReply;
          usedProvider = 'gemini';
        }
      } else if (provider === 'openai') {
        const openAiReply = await generateChatWithOpenAi(request.finding, message, history);
        if (openAiReply) {
          reply = openAiReply;
          usedProvider = 'openai';
        }
      }
    } catch {
      reply = buildLocalSecurityChatReply(request.finding, message);
      usedProvider = 'local';
    }

    const response: SecurityChatResponse = { reply, provider: usedProvider };
    chatCache.set(cacheKey, response);
    chatInFlight.delete(cacheKey);
    return response;
  };

  const pending = executor();
  chatInFlight.set(cacheKey, pending);
  return pending;
};
