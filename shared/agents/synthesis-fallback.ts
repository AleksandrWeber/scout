import type { AppLocale } from '../localization';
import type { AgentsSynthesis, AgentRunSummary } from './types';

type FindingLike = {
  severity: string;
  category: string;
  file: string;
  description: string;
};

const severityRank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const sortBySeverity = <T extends FindingLike>(findings: T[]) =>
  [...findings].sort(
    (left, right) =>
      (severityRank[left.severity] ?? 9) - (severityRank[right.severity] ?? 9)
  );

export const buildAgentsSynthesisFallback = (input: {
  locale: AppLocale;
  agentRuns: AgentRunSummary[];
  codeFindings: FindingLike[];
  dependencyFindings: FindingLike[];
}): AgentsSynthesis => {
  const allFindings = [...input.codeFindings, ...input.dependencyFindings];
  const highCount = allFindings.filter((finding) => finding.severity === 'HIGH').length;
  const topFindings = sortBySeverity(allFindings).slice(0, 3);

  const priorities =
    topFindings.length > 0
      ? topFindings.map(
          (finding) =>
            `[${finding.severity}] ${finding.category} — ${finding.file}: ${finding.description}`
        )
      : input.locale === 'uk'
        ? ['Критичних знахідок не виявлено — продовжуйте регулярні перевірки.']
        : ['No critical findings detected — keep running regular scans.'];

  const supplyChain = input.agentRuns.find((agent) => agent.id === 'supply-chain');
  const codeSecurity = input.agentRuns.find((agent) => agent.id === 'code-security');

  if (input.locale === 'uk') {
    return {
      overview: `Scout запустив ${input.agentRuns.length} спеціалізованих агентів. Знайдено ${allFindings.length} знахідок (${highCount} високого рівня). Агент ланцюга постачання перевірив секрети та залежності; агент безпеки коду — Semgrep і AST.`,
      priorities,
      consensusNote: `Ланцюг постачання: ${supplyChain?.findingsCount ?? 0} знах.; безпека коду: ${codeSecurity?.findingsCount ?? 0} знах. Пріоритети узгоджені за severity без додавання нових вразливостей.`
    };
  }

  return {
    overview: `Scout ran ${input.agentRuns.length} specialized agents and found ${allFindings.length} issue(s) (${highCount} high severity). The supply-chain agent checked secrets and dependencies; the code-security agent ran Semgrep and AST analysis.`,
    priorities,
    consensusNote: `Supply chain: ${supplyChain?.findingsCount ?? 0} finding(s); code security: ${codeSecurity?.findingsCount ?? 0} finding(s). Priorities are aligned by severity without inventing new vulnerabilities.`
  };
};
