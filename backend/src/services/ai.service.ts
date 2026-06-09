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

export const generateAiExplanation = async (finding: { [key: string]: unknown }) => {
  if (!OPENAI_API_KEY && !GEMINI_API_KEY && !AI_AGENT_URL) {
    return {
      summary: 'AI explanation service is not yet configured. Add an API key to .env.',
      recommendation: 'Set OPENAI_API_KEY or GEMINI_API_KEY or AI_AGENT_URL in your .env file.'
    };
  }

  if (openaiClient && OPENAI_API_KEY) {
    try {
      const prompt = `You are an AppSec engineer. Analyze the finding and provide: severity, short explanation, risk, suggested fix, and example fix code.\nFinding: ${JSON.stringify(
        finding
      )}`;

      const resp: any = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      });

      const text = resp.choices?.[0]?.message?.content || '';

      return {
        summary: text,
        recommendation: 'Use the generated explanation to enhance the report.'
      };
    } catch (err) {
      return {
        summary: 'AI call failed: ' + (err as Error).message,
        recommendation: 'Check your OPENAI_API_KEY and network connectivity.'
      };
    }
  }

  return {
    summary: 'AI integration is configured but non-OpenAI provider usage is not implemented.',
    recommendation: 'Implement provider-specific client (Gemini, Ollama) in this service using AI_KEYS.'
  };
};
