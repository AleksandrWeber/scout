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

const buildLocalAiExplanation = (finding: { [key: string]: unknown }) => {
  const severity = (finding.severity || 'LOW').toString();
  const category = (finding.category || 'Security finding').toString();
  const file = (finding.file || 'unknown file').toString();
  const description = (finding.description || 'No description provided.').toString();
  const risk = (finding.risk || 'No risk details available.').toString();
  const fix = (finding.fix || 'Review code and apply security best practices.').toString();

  return `Local AI fallback: ${severity} ${category} in ${file}. ${description} It poses the following risk: ${risk} Suggested fix: ${fix}`;
};

export const generateAiExplanation = async (finding: { [key: string]: unknown }) => {
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
    summary: buildLocalAiExplanation(finding),
    recommendation: 'Running in local AI fallback mode without external API keys.'
  };
};
