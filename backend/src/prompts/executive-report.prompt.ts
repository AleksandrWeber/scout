import type { AppLocale } from '../../../shared/localization';
import type { ReportBuildInput } from '../../../shared/reports';

export const EXECUTIVE_REPORT_PROMPT_VERSION = 'v1-plain-language';

const localeInstruction = (locale: AppLocale) =>
  locale === 'uk'
    ? 'Write in natural Ukrainian for non-technical stakeholders.'
    : 'Write in clear English for non-technical stakeholders.';

export const buildExecutiveReportPrompt = (input: ReportBuildInput): string => {
  const payload = {
    projectName: input.projectName,
    repoUrl: input.repoUrl,
    scannedAt: input.scannedAt,
    summary: input.summary,
    codeFindings: input.findings.slice(0, 8).map((finding) => ({
      severity: finding.severity,
      category: finding.category,
      file: finding.file,
      line: finding.line,
      description: finding.description,
      risk: finding.risk,
      fix: finding.fix
    })),
    dependencyFindings: input.dependencyFindings.slice(0, 8).map((finding) => ({
      severity: finding.severity,
      packageName: finding.dependency?.packageName,
      cveIds: finding.dependency?.cveIds,
      description: finding.description,
      fix: finding.fix
    }))
  };

  return `You are writing an executive security summary for managers, clients, or administrators.
${localeInstruction(input.locale)}

Rules:
- No jargon unless absolutely necessary.
- Focus on business impact: data theft, account takeover, service disruption, reputation damage.
- Do not invent findings that are not in the scan data.
- Keep priorities to at most 3 items.
- Keep next steps practical and short.

Return ONLY valid JSON with this shape:
{
  "overview": "2-4 sentences about the overall security picture",
  "priorities": ["priority 1", "priority 2"],
  "nextSteps": ["step 1", "step 2"]
}

Scan data:
${JSON.stringify(payload, null, 2)}`;
};
