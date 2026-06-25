import axios from 'axios';
import OpenAI from 'openai';
import { buildAgentsSynthesisFallback, type AgentsSynthesis, type AgentRunSummary } from '../../../../shared/agents';
import type { AppLocale } from '../../../../shared/localization';
import { buildAgentsSynthesisPrompt } from '../../prompts/agents-synthesis.prompt';
import { resolveProvider, scheduleAiRequest } from '../ai.service';
import {
  buildFindingsRetrievalQuery,
  retrieveKnowledgeContext
} from '../rag/knowledge-retrieval.service';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

type SynthesisInput = {
  locale: AppLocale;
  agentRuns: AgentRunSummary[];
  codeFindings: Array<{
    severity: string;
    category: string;
    file: string;
    description: string;
    scoutAgent?: string;
  }>;
  dependencyFindings: Array<{
    severity: string;
    category: string;
    file: string;
    description: string;
    scoutAgent?: string;
  }>;
  knowledgeContext?: string;
};

const parseSynthesis = (text: string): AgentsSynthesis | null => {
  try {
    const cleaned = text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed.overview !== 'string') {
      return null;
    }

    const priorities = Array.isArray(parsed.priorities)
      ? parsed.priorities.filter((item: unknown) => typeof item === 'string' && item.trim())
      : [];
    const consensusNote =
      typeof parsed.consensusNote === 'string' ? parsed.consensusNote.trim() : '';

    if (priorities.length === 0 || !consensusNote) {
      return null;
    }

    return {
      overview: parsed.overview.trim(),
      priorities,
      consensusNote
    };
  } catch {
    return null;
  }
};

const generateWithGemini = async (input: SynthesisInput): Promise<AgentsSynthesis | null> => {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const prompt = buildAgentsSynthesisPrompt(input);
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await scheduleAiRequest(() =>
    axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      },
      { timeout: 30_000 }
    )
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' ? parseSynthesis(text) : null;
};

const generateWithOpenAi = async (input: SynthesisInput): Promise<AgentsSynthesis | null> => {
  if (!openaiClient) {
    return null;
  }

  const response = await scheduleAiRequest(() =>
    openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: buildAgentsSynthesisPrompt(input) }]
    })
  );

  const text = response.choices[0]?.message?.content;
  return typeof text === 'string' ? parseSynthesis(text) : null;
};

export type SynthesisAgentResult = {
  id: 'synthesis';
  status: 'success' | 'skipped';
  durationMs: number;
  synthesis: AgentsSynthesis;
};

export const runSynthesisAgent = async (input: SynthesisInput): Promise<SynthesisAgentResult> => {
  const startedAt = Date.now();
  const provider = resolveProvider();
  const knowledge = await retrieveKnowledgeContext(
    buildFindingsRetrievalQuery([...input.codeFindings, ...input.dependencyFindings])
  );
  const promptInput = { ...input, knowledgeContext: knowledge.contextText };

  let synthesis: AgentsSynthesis | null = null;

  if (provider === 'gemini') {
    synthesis = await generateWithGemini(promptInput);
  } else if (provider === 'openai') {
    synthesis = await generateWithOpenAi(promptInput);
  }

  return {
    id: 'synthesis',
    status: 'success',
    durationMs: Date.now() - startedAt,
    synthesis:
      synthesis ??
      buildAgentsSynthesisFallback({
        locale: input.locale,
        agentRuns: input.agentRuns,
        codeFindings: input.codeFindings,
        dependencyFindings: input.dependencyFindings
      })
  };
};
