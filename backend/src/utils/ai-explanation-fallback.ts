import { AppLocale } from '../../../shared/localization';
import { buildLocalizedAiExplanation } from '../../../shared/localization';
import { normalizeSeverity } from './severity';

export interface AiExplanationFields {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  risk: string;
  suggestedFix: string;
  codeSample?: string;
  beginnerExplanation?: string;
}

const normalizeText = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

export const isMostlySameText = (left: string, right: string) => {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length > 24 && b.includes(a)) return true;
  if (b.length > 24 && a.includes(b)) return true;
  return false;
};

const GENERIC_BEGINNER_PATTERNS = [
  /think of this as a weak spot/i,
  /fixing it now is cheaper/i,
  /dealing with an incident later/i,
  /how the app handles data or dependencies/i,
  /potential security problem/i,
  /focus on sanitizing input/i
];

export const isGenericBeginnerExplanation = (text: string) => {
  const normalized = normalizeText(text);
  if (!normalized) return true;
  return GENERIC_BEGINNER_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const isGenericCodeSample = (text: string) => {
  const normalized = normalizeText(text);
  if (!normalized) return true;
  return (
    normalized === 'sanitize input before use' ||
    (normalized.includes('sanitize input') && normalized.length < 80) ||
    normalized.includes('example fix')
  );
};

export const buildLocalBeginnerExplanation = (finding: { [key: string]: unknown }) => {
  const category = (finding.category || '').toString().toUpperCase();
  const file = (finding.file || 'this file').toString();
  const description = (finding.description || '').toString().toLowerCase();
  const education = (finding.education || '').toString().trim();

  if (category.includes('XSS')) {
    if (description.includes('dangerouslysetinnerhtml')) {
      return `React normally escapes text so it cannot run as code. In ${file}, dangerouslySetInnerHTML skips that guard — HTML you pass in is executed by the browser as-is.`;
    }
    if (description.includes('innerhtml')) {
      return `Writing to innerHTML in ${file} tells the browser to treat a string as real webpage markup. If that string comes from a user, they can hide a script inside it.`;
    }
    return `Cross-site scripting in ${file} means someone else's text can become live webpage code. The browser cannot tell attacker content apart from yours.`;
  }

  if (category.includes('DEPENDENCY')) {
    const packageName = (finding.description || '').toString().split(/\s+/)[0] || 'a dependency';
    return `${packageName} is a third-party package listed in package.json. Known flaws in specific versions are published publicly, so outdated installs are an easy target.`;
  }

  if (category.includes('CODE_INJECTION') || category.includes('INJECTION') || category.includes('EVAL')) {
    if (description.includes('eval')) {
      return `eval() in ${file} runs whatever text it receives as JavaScript. If any part of that text comes from outside your team, an attacker can execute commands in users' browsers.`;
    }
    if (description.includes('new function')) {
      return `new Function() in ${file} builds and runs code from a string — the same idea as eval(). Feeding it untrusted input gives attackers a direct path to run code.`;
    }
    if (description.includes('document.write')) {
      return `document.write in ${file} injects HTML straight into the page while it loads. Untrusted content there can embed scripts that run for every visitor.`;
    }
    return `The code in ${file} can turn outside input into executable instructions. That is dangerous whenever the input is not fully controlled by you.`;
  }

  if (category.includes('SECRET') || category.includes('CREDENTIAL')) {
    return `Credentials stored directly in ${file} usually end up in git history and build artifacts. Anyone with repo access can copy and reuse them elsewhere.`;
  }

  if (education && !/semgrep identified this pattern/i.test(education)) {
    return `${education} (flagged in ${file})`;
  }

  const readableCategory = category.replace(/_/g, ' ').toLowerCase();
  return `This ${readableCategory} alert in ${file} marks a pattern that has caused real incidents before. Open that line and trace where the data comes from — that context matters more than a generic security tip.`;
};

export const buildLocalSummary = (finding: { [key: string]: unknown }) => {
  const category = (finding.category || 'security issue').toString();
  const file = (finding.file || 'unknown file').toString();
  const line = finding.line ? ` at line ${finding.line}` : '';
  const description = (finding.description || '').toString();

  if (description) {
    return `${category} in ${file}${line}: ${description}`;
  }

  return `The scanner flagged ${category} in ${file}${line}.`;
};

export const buildLocalRisk = (finding: { [key: string]: unknown }) => {
  const category = (finding.category || '').toString().toUpperCase();
  const file = (finding.file || 'the affected file').toString();

  if (category.includes('XSS')) {
    return `An attacker could inject scripts through ${file}, steal session cookies, or perform actions as the victim user.`;
  }
  if (category.includes('DEPENDENCY')) {
    return `A known flaw in a bundled library may let attackers crash the service, leak data, or run code depending on the advisory.`;
  }
  if (category.includes('INJECTION') || category.includes('EVAL') || category.includes('CODE_INJECTION')) {
    return `Untrusted input reaching dynamic code execution in ${file} can escalate to full remote code execution in the browser or server.`;
  }

  const risk = (finding.risk || '').toString();
  if (risk) {
    return risk;
  }

  return `Leaving this unresolved in ${file} gives attackers a foothold they can chain into bigger damage.`;
};

export const buildLocalCodeSample = (finding: { [key: string]: unknown }) => {
  const category = (finding.category || '').toString().toUpperCase();
  const file = (finding.file || 'the affected file').toString();

  if (category.includes('XSS')) {
    return `// ${file}\n// Before\n<div dangerouslySetInnerHTML={{ __html: userComment }} />\n\n// After\nimport DOMPurify from 'dompurify';\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />`;
  }

  if (category.includes('DEPENDENCY')) {
    const packageName = (finding.description || '').toString().split(/\s+/)[0] || '<package-name>';
    return `# Check vulnerable packages\nnpm audit\n\n# Upgrade the affected dependency\nnpm install ${packageName}@latest`;
  }

  if (category.includes('INJECTION') || category.includes('EVAL') || category.includes('CODE_INJECTION')) {
    return `// ${file}\n// Before\nconst result = eval(userInput);\n\n// After\nconst result = parseUserInputSafely(userInput);`;
  }

  if (category.includes('SECRET') || category.includes('CREDENTIAL')) {
    return `// Before\nconst apiKey = "hardcoded-secret";\n\n// After\nconst apiKey = process.env.API_KEY;`;
  }

  const fix = (finding.fix || 'Apply the recommended secure pattern for this file.').toString();
  return `// ${file}\n// Suggested direction:\n// ${fix}`;
};

export const buildLocalAiExplanation = (finding: { [key: string]: unknown }): AiExplanationFields => ({
  severity: normalizeSeverity((finding.severity || 'LOW').toString()),
  summary: buildLocalSummary(finding),
  risk: buildLocalRisk(finding),
  suggestedFix: (finding.fix || 'Review the flagged code path and apply a secure pattern that matches this issue type.').toString(),
  codeSample: buildLocalCodeSample(finding),
  beginnerExplanation: buildLocalBeginnerExplanation(finding)
});

export const finalizeAiExplanation = (
  finding: { [key: string]: unknown },
  explanation: AiExplanationFields,
  locale: AppLocale = 'en'
): AiExplanationFields => {
  const fallback =
    locale === 'uk' ? buildLocalizedAiExplanation(finding, 'uk') : buildLocalAiExplanation(finding);

  return {
    ...explanation,
    summary: isMostlySameText(explanation.summary, String(finding.description || ''))
      ? fallback.summary
      : explanation.summary,
    risk: isMostlySameText(explanation.risk, String(finding.risk || '')) ? fallback.risk : explanation.risk,
    suggestedFix: explanation.suggestedFix || fallback.suggestedFix,
    codeSample: isGenericCodeSample(explanation.codeSample || '') ? fallback.codeSample : explanation.codeSample,
    beginnerExplanation: isGenericBeginnerExplanation(explanation.beginnerExplanation || '')
      ? fallback.beginnerExplanation
      : explanation.beginnerExplanation
  };
};
