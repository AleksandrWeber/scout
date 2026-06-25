import { localizeFinding, type LocalizableFinding } from '../localization';
import type { Finding } from '../types';
import { getReportLabels } from './labels';
import { countFindingsBySeverity, sortFindingsBySeverity } from './report-helpers';
import type { ExecutiveNarrative, ReportBuildInput } from './types';

const toPlainSummary = (finding: Finding, locale: ReportBuildInput['locale']): string => {
  const localized = localizeFinding(finding as LocalizableFinding, locale);
  const summary = localized.aiExplanation?.summary || localized.description;
  return summary.replace(/\s+/g, ' ').trim();
};

const buildImpactParagraph = (
  labels: ReturnType<typeof getReportLabels>,
  counts: ReturnType<typeof countFindingsBySeverity>
): string => {
  if (counts.HIGH > 0) {
    return labels.executiveImpactHigh;
  }

  if (counts.MEDIUM > 0) {
    return labels.executiveImpactMedium;
  }

  if (counts.LOW > 0) {
    return labels.executiveImpactLow;
  }

  return labels.executiveNoIssues;
};

const buildPriorityItems = (input: ReportBuildInput): string[] => {
  const combined = sortFindingsBySeverity([...input.findings, ...input.dependencyFindings]);
  const top = combined.slice(0, 3);

  return top.map((finding, index) => {
    const localized = localizeFinding(finding as LocalizableFinding, input.locale);
    const plain = toPlainSummary(finding, input.locale);
    const prefix = `${index + 1}. [${localized.severity}]`;

    if (finding.dependency?.packageName) {
      const packageLabel = input.locale === 'uk' ? 'Пакет' : 'Package';
      return `${prefix} ${packageLabel} ${finding.dependency.packageName}: ${plain}`;
    }

    const location = finding.file
      ? finding.line
        ? `${finding.file}:${finding.line}`
        : finding.file
      : input.locale === 'uk'
        ? 'код проєкту'
        : 'project code';

    return `${prefix} ${location}: ${plain}`;
  });
};

const buildNextSteps = (
  input: ReportBuildInput,
  counts: ReturnType<typeof countFindingsBySeverity>
): string[] => {
  if (input.summary.total === 0) {
    return input.locale === 'uk'
      ? ['Продовжуйте регулярно оновлювати залежності та повторювати перевірки перед релізами.']
      : ['Keep dependencies updated and rerun checks before major releases.'];
  }

  const steps: string[] = [];

  if (counts.HIGH > 0) {
    steps.push(
      input.locale === 'uk'
        ? 'Доручіть розробникам усунути критичні знахідки в найближчі дні.'
        : 'Ask the development team to fix critical findings within the next few days.'
    );
  }

  if (input.summary.dependencyFindings > 0) {
    steps.push(
      input.locale === 'uk'
        ? 'Оновіть вразливі npm-пакети до рекомендованих версій.'
        : 'Upgrade vulnerable npm packages to the recommended versions.'
    );
  }

  if (input.summary.codeFindings > 0) {
    steps.push(
      input.locale === 'uk'
        ? 'Перевірте форми, API та місця введення даних — там зосереджені основні ризики.'
        : 'Review forms, APIs, and user input paths — that is where most code risks concentrate.'
    );
  }

  steps.push(
    input.locale === 'uk'
      ? 'Після виправлень повторіть сканування, щоб підтвердити результат.'
      : 'Rerun the scan after fixes to confirm the issues are resolved.'
  );

  return steps;
};

export const buildExecutiveNarrativeFallback = (input: ReportBuildInput): ExecutiveNarrative => {
  const labels = getReportLabels(input.locale);
  const allFindings = [...input.findings, ...input.dependencyFindings];
  const severityCounts = countFindingsBySeverity(allFindings);
  const priorities = buildPriorityItems(input);

  return {
    overview: buildImpactParagraph(labels, severityCounts),
    priorities: priorities.length > 0 ? priorities : [labels.executiveNoIssues],
    nextSteps: buildNextSteps(input, severityCounts)
  };
};
