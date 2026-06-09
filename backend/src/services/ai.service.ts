import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const AI_AGENT_URL = process.env.AI_AGENT_URL || '';

export const AI_KEYS = {
  OPENAI_API_KEY,
  GEMINI_API_KEY,
  AI_AGENT_URL
};

const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export interface AiExplanationResult {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  risk: string;
  suggestedFix: string;
  codeSample?: string;
  beginnerExplanation?: string;
}

const normalizeSeverity = (value: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const normalized = value?.toString().trim().toUpperCase();
  if (normalized === 'HIGH' || normalized === 'MEDIUM') return normalized;
  return 'LOW';
};

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

const buildCacheKey = (finding: { [key: string]: unknown }) => {
  return stableStringify({
    severity: finding.severity,
    category: finding.category,
    file: finding.file,
    description: finding.description,
    risk: finding.risk,
    fix: finding.fix,
    education: finding.education
  });
};

const aiExplanationCache = new Map<string, AiExplanationResult>();
const aiInFlightRequests = new Map<string, Promise<AiExplanationResult>>();
const MAX_CONCURRENT_OPENAI_REQUESTS = 2;
let activeOpenAiRequests = 0;
const openAiRequestQueue: Array<() => void> = [];

const acquireOpenAiSlot = async () => {
  if (activeOpenAiRequests < MAX_CONCURRENT_OPENAI_REQUESTS) {
    activeOpenAiRequests += 1;
    return;
  }

  await new Promise<void>((resolve) => openAiRequestQueue.push(resolve));
  activeOpenAiRequests += 1;
};

const releaseOpenAiSlot = () => {
  activeOpenAiRequests -= 1;
  const next = openAiRequestQueue.shift();
  if (next) next();
};

const scheduleOpenAiRequest = async <T>(fn: () => Promise<T>): Promise<T> => {
  await acquireOpenAiSlot();
  try {
    return await fn();
  } finally {
    releaseOpenAiSlot();
  }
};

const buildLocalAiExplanation = (finding: { [key: string]: unknown }): AiExplanationResult => {
  return {
    severity: normalizeSeverity((finding.severity || 'LOW').toString()),
    summary: `Local fallback: ${finding.category || 'security issue'} in ${finding.file || 'unknown file'}. ${finding.description || 'No description provided.'}`,
    risk: (finding.risk || 'No risk details available.').toString(),
    suggestedFix: (finding.fix || 'Review code and apply security best practices.').toString(),
    codeSample: `// Example fix:\n// sanitize input before use`,
    beginnerExplanation: `This finding is a potential security problem. Focus on sanitizing input and validating data to avoid vulnerabilities.`
  };
};

export const generateAiExplanation = async (finding: { [key: string]: unknown }): Promise<AiExplanationResult> => {
  const cacheKey = buildCacheKey(finding);
  if (aiExplanationCache.has(cacheKey)) {
    return aiExplanationCache.get(cacheKey)!;
  }

  if (aiInFlightRequests.has(cacheKey)) {
    return aiInFlightRequests.get(cacheKey)!;
  }

  const executor = async () => {
    let explanation: AiExplanationResult;

    if (openaiClient && OPENAI_API_KEY) {
      try {
        const prompt = `You are an AppSec engineer. Given the finding object, return valid JSON only with the following fields: severity, summary, risk, suggestedFix, codeSample, beginnerExplanation. If a field is not available, use an empty string. Provide exactly one JSON object and nothing else.\nFinding: ${JSON.stringify(
          finding
        )}`;

        const resp: any = await scheduleOpenAiRequest(() =>
          openaiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          })
        );

        const text = resp.choices?.[0]?.message?.content || '';
        const parsed = parseJsonResponse(text);
        explanation = parsed || buildLocalAiExplanation(finding);
      } catch {
        explanation = buildLocalAiExplanation(finding);
      }
    } else {
      explanation = buildLocalAiExplanation(finding);
    }

    aiExplanationCache.set(cacheKey, explanation);
    aiInFlightRequests.delete(cacheKey);
    return explanation;
  };

  const pending = executor();
  aiInFlightRequests.set(cacheKey, pending);
  return pending;
};
