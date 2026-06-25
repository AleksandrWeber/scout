export const INFORMATIONAL_FINDING_CATEGORIES = new Set([
  'STATIC_SCAN',
  'DEPENDENCY_ANALYSIS',
  'DEPENDENCY_AUDIT',
  'SEMgrep_INTEGRATION',
  'SEMgrep_PARSE'
]);

export const isInformationalFindingCategory = (category: string, file?: string) =>
  INFORMATIONAL_FINDING_CATEGORIES.has(category) || file === 'N/A';

const isWhyQuestion = (message: string) =>
  /why|чому|небезпечн|dangerous|ризик|risk/i.test(message);

const isFixQuestion = (message: string) =>
  /fix|how do i|how to|як|що робити|what to do|what should/i.test(message);

const isExampleQuestion = (message: string) => /example|code|приклад/i.test(message);

const buildStaticScanReply = (finding: Record<string, unknown>, message: string) => {
  const lower = message.toLowerCase();

  if (isWhyQuestion(lower)) {
    return (
      'This is not a vulnerability. STATIC_SCAN means the first-pass scanner did not match known risky patterns in JS/TS files. ' +
      'It does not mean your app is fully secure — only that nothing obvious was found in this lightweight check. ' +
      (finding.risk ? String(finding.risk) : '')
    ).trim();
  }

  if (isFixQuestion(lower) || lower.includes('що робити')) {
    return (
      'No code change is required for this message. Next steps: scan a repo with real JS/TS source files, install Semgrep on the backend host for deeper rules, ' +
      'or test against a project with known issues (XSS, eval) to verify Scout is working end-to-end.'
    );
  }

  if (lower.includes('next') || lower.includes('далі')) {
    return 'Try another repository with JavaScript or TypeScript code, confirm Semgrep is installed locally, and check the Dependencies tab if the project has package.json.';
  }

  return (
    'STATIC_SCAN is informational — Scout did not find obvious bad patterns. ' +
    'Ask "what should I do next?" or "why is this shown?" if you want guidance. ' +
    'This is different from XSS or dependency findings where a specific file needs a fix.'
  );
};

const buildDependencyInfoReply = (finding: Record<string, unknown>, message: string) => {
  const lower = message.toLowerCase();
  const description = (finding.description || '').toString();

  if (isWhyQuestion(lower)) {
    return `This dependency message is informational: ${description} ${finding.risk || ''}`.trim();
  }

  if (isFixQuestion(lower) || lower.includes('що робити')) {
    return `Suggested action: ${finding.fix || 'Review package.json and run npm audit after ensuring a valid lockfile exists.'}`;
  }

  return `Dependency scan note: ${description}. Ask how to fix npm audit setup or why this message appeared.`;
};

const buildSemgrepIntegrationReply = (finding: Record<string, unknown>, message: string) => {
  if (isFixQuestion(message) || message.toLowerCase().includes('що робити')) {
    return `Install Semgrep on the machine running Scout, then re-run the analysis. ${finding.fix || ''}`.trim();
  }

  return (
    'Semgrep did not run or could not be parsed, so Semgrep-specific findings are missing. ' +
    'Fix the integration first — this is a tooling issue, not a flaw in your application code.'
  );
};

export const buildLocalSecurityChatReply = (
  finding: Record<string, unknown>,
  message: string,
  knowledgeContext = ''
): string => {
  const category = (finding.category || 'security issue').toString();
  const file = (finding.file || 'the affected file').toString();
  const fix = (finding.fix || 'Review the flagged code and apply a secure pattern.').toString();
  const risk = (finding.risk || 'An attacker may abuse this pattern.').toString();
  const description = (finding.description || '').toString();
  const lower = message.toLowerCase();

  if (isInformationalFindingCategory(category, file)) {
    if (category === 'STATIC_SCAN') {
      return buildStaticScanReply(finding, message);
    }
    if (category.startsWith('DEPENDENCY_')) {
      return buildDependencyInfoReply(finding, message);
    }
    if (category.startsWith('SEMgrep_')) {
      return buildSemgrepIntegrationReply(finding, message);
    }
  }

  if (isWhyQuestion(lower)) {
    return `${category} in ${file} matters because: ${risk} In practice, ${description}`;
  }

  if (isFixQuestion(lower)) {
    const location = file === 'N/A' ? 'the flagged location' : file;
    return `In ${location}, start here: ${fix} After changing the code, run Scout again to confirm the finding disappears.`;
  }

  if (isExampleQuestion(lower)) {
    const sample = (finding.aiExplanation as { codeSample?: string } | undefined)?.codeSample;
    if (sample) {
      return `Here is a concrete direction:\n${sample}`;
    }
    return `For ${category} in ${file}, replace the unsafe pattern with validated input handling and safe rendering APIs.`;
  }

  const baseReply =
    `This is a ${category} finding in ${file}. ` +
    `Try asking "how do I fix this?" or "why is this dangerous?" — or in Ukrainian: "що робити?" / "чому це небезпечно?". ` +
    `Quick direction: ${fix}`;

  if (knowledgeContext.trim()) {
    const excerpt = knowledgeContext.split('\n\n')[0]?.slice(0, 320);
    return `${baseReply}\n\nKnowledge base note: ${excerpt}`;
  }

  return baseReply;
};
