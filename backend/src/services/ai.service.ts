import axios from 'axios';
import OpenAI from 'openai';
import {
  buildVulnerabilityAnalysisPrompt,
  VULNERABILITY_PROMPT_VERSION
} from '../prompts/vulnerability-analysis.prompt';
import { AppLocale } from '../../../shared/localization';
import { buildLocalizedAiExplanation } from '../../../shared/localization';
import {
  AiExplanationFields,
  buildLocalAiExplanation,
  finalizeAiExplanation
} from '../utils/ai-explanation-fallback';
import { normalizeSeverity } from '../utils/severity';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const AI_AGENT_URL = process.env.AI_AGENT_URL || '';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'auto').toLowerCase();

export const AI_KEYS = {
  OPENAI_API_KEY,
  GEMINI_API_KEY,
  AI_AGENT_URL,
  AI_PROVIDER
};

const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export type AiExplanationResult = AiExplanationFields;

const parseJsonResponse = (text: string): AiExplanationResult | null => {
  try {
    const cleaned = text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);
    return {
      severity: normalizeSeverity(parsed.severity || parsed.level || 'LOW'),
      summary: parsed.summary || parsed.explanation || '',
      risk: parsed.risk || '',
      suggestedFix: parsed.suggestedFix || parsed.fix || parsed.recommendedFix || '',
      codeSample: parsed.codeSample || parsed.code || '',
      beginnerExplanation: parsed.beginnerExplanation || parsed.simpleExplanation || ''
    };
  } catch {
    return null;
  }
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

const buildCacheKey = (finding: { [key: string]: unknown }, locale: AppLocale) => {
  return stableStringify({
    promptVersion: VULNERABILITY_PROMPT_VERSION,
    locale,
    severity: finding.severity,
    category: finding.category,
    file: finding.file,
    line: finding.line,
    description: finding.description,
    risk: finding.risk,
    fix: finding.fix,
    education: finding.education
  });
};

const aiExplanationCache = new Map<string, AiExplanationResult>();
const aiInFlightRequests = new Map<string, Promise<AiExplanationResult>>();
const MAX_CONCURRENT_AI_REQUESTS = 2;
let activeAiRequests = 0;
const aiRequestQueue: Array<() => void> = [];

const acquireAiSlot = async () => {
  if (activeAiRequests < MAX_CONCURRENT_AI_REQUESTS) {
    activeAiRequests += 1;
    return;
  }

  await new Promise<void>((resolve) => aiRequestQueue.push(resolve));
  activeAiRequests += 1;
};

const releaseAiSlot = () => {
  activeAiRequests -= 1;
  const next = aiRequestQueue.shift();
  if (next) next();
};

export const scheduleAiRequest = async <T>(fn: () => Promise<T>): Promise<T> => {
  await acquireAiSlot();
  try {
    return await fn();
  } finally {
    releaseAiSlot();
  }
};

export const resolveProvider = (): 'gemini' | 'openai' | 'local' => {
  if (AI_PROVIDER === 'gemini') {
    return GEMINI_API_KEY ? 'gemini' : 'local';
  }
  if (AI_PROVIDER === 'openai') {
    return OPENAI_API_KEY ? 'openai' : 'local';
  }
  if (GEMINI_API_KEY) return 'gemini';
  if (OPENAI_API_KEY) return 'openai';
  return 'local';
};

const buildLocalExplanation = (finding: { [key: string]: unknown }, locale: AppLocale) =>
  locale === 'uk'
    ? buildLocalizedAiExplanation(finding, 'uk')
    : buildLocalAiExplanation(finding);

const generateWithGemini = async (
  finding: { [key: string]: unknown },
  locale: AppLocale
): Promise<AiExplanationResult | null> => {
  if (!GEMINI_API_KEY) return null;

  const prompt = buildVulnerabilityAnalysisPrompt(finding, locale);
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await scheduleAiRequest(() =>
    axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.45,
          responseMimeType: 'application/json'
        }
      },
      { timeout: 30_000 }
    )
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = parseJsonResponse(text);
  return parsed ? finalizeAiExplanation(finding, parsed, locale) : null;
};

const generateWithOpenAi = async (
  finding: { [key: string]: unknown },
  locale: AppLocale
): Promise<AiExplanationResult | null> => {
  if (!openaiClient || !OPENAI_API_KEY) return null;

  const prompt = buildVulnerabilityAnalysisPrompt(finding, locale);
  const resp = await scheduleAiRequest(() =>
    openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.45
    })
  );

  const text = resp.choices?.[0]?.message?.content || '';
  const parsed = parseJsonResponse(text);
  return parsed ? finalizeAiExplanation(finding, parsed, locale) : null;
};

export const generateAiExplanation = async (
  finding: { [key: string]: unknown },
  locale: AppLocale = 'en'
): Promise<AiExplanationResult> => {
  const cacheKey = buildCacheKey(finding, locale);
  if (aiExplanationCache.has(cacheKey)) {
    return aiExplanationCache.get(cacheKey)!;
  }

  if (aiInFlightRequests.has(cacheKey)) {
    return aiInFlightRequests.get(cacheKey)!;
  }

  const executor = async () => {
    let explanation: AiExplanationResult = buildLocalExplanation(finding, locale);
    const provider = resolveProvider();

    try {
      if (provider === 'gemini') {
        explanation = (await generateWithGemini(finding, locale)) || buildLocalExplanation(finding, locale);
      } else if (provider === 'openai') {
        explanation = (await generateWithOpenAi(finding, locale)) || buildLocalExplanation(finding, locale);
      }
    } catch {
      explanation = buildLocalExplanation(finding, locale);
    }

    aiExplanationCache.set(cacheKey, explanation);
    aiInFlightRequests.delete(cacheKey);
    return explanation;
  };

  const pending = executor();
  aiInFlightRequests.set(cacheKey, pending);
  return pending;
};
