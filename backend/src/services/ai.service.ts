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
  if (openaiClient && OPENAI_API_KEY) {
    try {
      const prompt = `You are an AppSec engineer. Given the finding object, return valid JSON only with the following fields: severity, summary, risk, suggestedFix, codeSample, beginnerExplanation. If a field is not available, use an empty string. Provide exactly one JSON object and nothing else.\nFinding: ${JSON.stringify(
        finding
      )}`;

      const resp: any = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      });

      const text = resp.choices?.[0]?.message?.content || '';
      const parsed = parseJsonResponse(text);
      if (parsed) {
        return parsed;
      }

      return buildLocalAiExplanation(finding);
    } catch (err) {
      return buildLocalAiExplanation(finding);
    }
  }

  return buildLocalAiExplanation(finding);
};
