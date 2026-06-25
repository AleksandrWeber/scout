import axios from 'axios';
import OpenAI from 'openai';
import { normalizeLocale, type AppLocale } from '../../../shared/localization';
import {
  buildExecutiveNarrativeFallback,
  type ExecutiveNarrative,
  type ReportBuildInput
} from '../../../shared/reports';
import { buildExecutiveReportPrompt } from '../prompts/executive-report.prompt';
import { resolveProvider, scheduleAiRequest } from './ai.service';
import {
  buildFindingsRetrievalQuery,
  retrieveKnowledgeContext
} from './rag/knowledge-retrieval.service';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const parseExecutiveNarrative = (text: string): ExecutiveNarrative | null => {
  try {
    const cleaned = text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed.overview !== 'string') {
      return null;
    }

    const priorities = Array.isArray(parsed.priorities)
      ? parsed.priorities.filter((item: unknown) => typeof item === 'string' && item.trim())
      : [];
    const nextSteps = Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.filter((item: unknown) => typeof item === 'string' && item.trim())
      : [];

    if (priorities.length === 0 || nextSteps.length === 0) {
      return null;
    }

    return {
      overview: parsed.overview.trim(),
      priorities,
      nextSteps
    };
  } catch {
    return null;
  }
};

const generateWithGemini = async (
  input: ReportBuildInput,
  knowledgeContext: string
): Promise<ExecutiveNarrative | null> => {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const prompt = buildExecutiveReportPrompt(input, knowledgeContext);
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await scheduleAiRequest(() =>
    axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json'
        }
      },
      { timeout: 30_000 }
    )
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseExecutiveNarrative(text);
};

const generateWithOpenAi = async (
  input: ReportBuildInput,
  knowledgeContext: string
): Promise<ExecutiveNarrative | null> => {
  if (!openaiClient || !OPENAI_API_KEY) {
    return null;
  }

  const prompt = buildExecutiveReportPrompt(input, knowledgeContext);
  const response = await scheduleAiRequest(() =>
    openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    })
  );

  const text = response.choices?.[0]?.message?.content || '';
  return parseExecutiveNarrative(text);
};

export type ExecutiveReportResponse = {
  narrative: ExecutiveNarrative;
  provider: 'gemini' | 'openai' | 'local';
};

export const generateExecutiveNarrative = async (
  input: ReportBuildInput
): Promise<ExecutiveReportResponse> => {
  const locale: AppLocale = normalizeLocale(input.locale);
  const normalizedInput = { ...input, locale };
  const provider = resolveProvider();
  const knowledge = await retrieveKnowledgeContext(
    buildFindingsRetrievalQuery([
      ...normalizedInput.findings,
      ...normalizedInput.dependencyFindings
    ])
  );

  try {
    if (provider === 'gemini') {
      const narrative = await generateWithGemini(normalizedInput, knowledge.contextText);
      if (narrative) {
        return { narrative, provider: 'gemini' };
      }
    }

    if (provider === 'openai') {
      const narrative = await generateWithOpenAi(normalizedInput, knowledge.contextText);
      if (narrative) {
        return { narrative, provider: 'openai' };
      }
    }
  } catch {
    // fall through to local narrative
  }

  return {
    narrative: buildExecutiveNarrativeFallback(normalizedInput),
    provider: 'local'
  };
};
