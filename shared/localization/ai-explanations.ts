import { getCategoryLabel } from './category-labels';
import { AppLocale } from './locale';
import { translateText } from './translate-text';

export interface LocalizedAiExplanation {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  risk: string;
  suggestedFix: string;
  codeSample?: string;
  beginnerExplanation?: string;
}

const normalizeSeverity = (value: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'CRITICAL' || normalized === 'HIGH') return 'HIGH';
  if (normalized === 'MODERATE' || normalized === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

const buildSummary = (finding: Record<string, unknown>, locale: AppLocale) => {
  const category = getCategoryLabel(String(finding.category || 'security issue'), locale);
  const file = String(finding.file || 'unknown file');
  const line = finding.line ? (locale === 'uk' ? `, рядок ${finding.line}` : ` at line ${finding.line}`) : '';
  const description = translateText(String(finding.description || ''), locale);

  if (description) {
    return locale === 'uk'
      ? `${category} у ${file}${line}: ${description}`
      : `${category} in ${file}${line}: ${description}`;
  }

  return locale === 'uk'
    ? `Сканер позначив ${category} у ${file}${line}.`
    : `The scanner flagged ${category} in ${file}${line}.`;
};

const buildRisk = (finding: Record<string, unknown>, locale: AppLocale) => {
  const category = String(finding.category || '').toUpperCase();
  const file = String(finding.file || (locale === 'uk' ? 'ураженому файлі' : 'the affected file'));
  const description = String(finding.description || '').toLowerCase();

  if (category.includes('XSS')) {
    return locale === 'uk'
      ? `Зловмисник може впровадити скрипти через ${file}, викрасти сесійні cookie або виконати дії від імені жертви.`
      : `An attacker could inject scripts through ${file}, steal session cookies, or perform actions as the victim user.`;
  }

  if (category.includes('DEPENDENCY')) {
    return locale === 'uk'
      ? 'Відома вразливість у бібліотеці може дозволити зловмиснику збої, витік даних або виконання коду — залежно від advisory.'
      : 'A known flaw in a bundled library may let attackers crash the service, leak data, or run code depending on the advisory.';
  }

  if (category.includes('INJECTION') || category.includes('EVAL') || category.includes('CODE_INJECTION')) {
    return locale === 'uk'
      ? `Недовірений ввід, що потрапляє в динамічне виконання коду в ${file}, може перерости у повне віддалене виконання коду.`
      : `Untrusted input reaching dynamic code execution in ${file} can escalate to full remote code execution in the browser or server.`;
  }

  const risk = translateText(String(finding.risk || ''), locale);
  if (risk) {
    return risk;
  }

  return locale === 'uk'
    ? `Ігнорування цієї проблеми в ${file} дає зловмиснику опору для подальших атак.`
    : `Leaving this unresolved in ${file} gives attackers a foothold they can chain into bigger damage.`;
};

const buildBeginnerExplanation = (finding: Record<string, unknown>, locale: AppLocale) => {
  const category = String(finding.category || '').toUpperCase();
  const file = String(finding.file || (locale === 'uk' ? 'цьому файлі' : 'this file'));
  const description = String(finding.description || '').toLowerCase();
  const education = translateText(String(finding.education || '').trim(), locale);

  if (category.includes('XSS')) {
    if (description.includes('dangerouslysetinnerhtml')) {
      return locale === 'uk'
        ? `React зазвичай екранує текст, щоб він не виконувався як код. У ${file} dangerouslySetInnerHTML вимикає цей захист — HTML виконується браузером як є.`
        : `React normally escapes text so it cannot run as code. In ${file}, dangerouslySetInnerHTML skips that guard — HTML you pass in is executed by the browser as-is.`;
    }
    if (description.includes('innerhtml')) {
      return locale === 'uk'
        ? `Запис у innerHTML у ${file} змушує браузер сприймати рядок як справжню HTML-розмітку. Якщо рядок від користувача, у ньому можна сховати скрипт.`
        : `Writing to innerHTML in ${file} tells the browser to treat a string as real webpage markup. If that string comes from a user, they can hide a script inside it.`;
    }
    return locale === 'uk'
      ? `XSS у ${file} означає, що чужий текст може стати живим кодом сторінки. Браузер не відрізнить шкідливий вміст від вашого.`
      : `Cross-site scripting in ${file} means someone else's text can become live webpage code. The browser cannot tell attacker content apart from yours.`;
  }

  if (category.includes('DEPENDENCY')) {
    const packageName = String(finding.description || '').split(/\s+/)[0] || 'залежність';
    return locale === 'uk'
      ? `${packageName} — сторонній пакет у package.json. Відомі вразливості в певних версіях публікуються відкрито, тож застарілі версії — легка ціль.`
      : `${packageName} is a third-party package listed in package.json. Known flaws in specific versions are published publicly, so outdated installs are an easy target.`;
  }

  if (category.includes('CODE_INJECTION') || category.includes('INJECTION') || category.includes('EVAL')) {
    if (description.includes('eval')) {
      return locale === 'uk'
        ? `eval() у ${file} виконує будь-який текст як JavaScript. Якщо частина тексту ззовні, зловмисник може запускати команди в браузері користувачів.`
        : `eval() in ${file} runs whatever text it receives as JavaScript. If any part of that text comes from outside your team, an attacker can execute commands in users' browsers.`;
    }
    if (description.includes('new function')) {
      return locale === 'uk'
        ? `new Function() у ${file} збирає та виконує код із рядка — як eval(). Недовірений ввід дає прямий шлях до виконання коду.`
        : `new Function() in ${file} builds and runs code from a string — the same idea as eval(). Feeding it untrusted input gives attackers a direct path to run code.`;
    }
    return locale === 'uk'
      ? `Код у ${file} може перетворити зовнішній ввід на виконувані інструкції. Це небезпечно, коли ввід не повністю під вашим контролем.`
      : `The code in ${file} can turn outside input into executable instructions. That is dangerous whenever the input is not fully controlled by you.`;
  }

  if (category.includes('AST_DATA_FLOW')) {
    return locale === 'uk'
      ? `У ${file} дані користувача можуть дійти до небезпечної операції без перевірки. Це як передати ключі незнайомцю — наслідки залежать від sink.`
      : `In ${file}, user data may reach a dangerous operation without checks. Think of it as handing unverified input straight to a risky API.`;
  }

  if (education && !/semgrep identified this pattern/i.test(education)) {
    return locale === 'uk' ? `${education} (позначено в ${file})` : `${education} (flagged in ${file})`;
  }

  const readableCategory = getCategoryLabel(category, locale).toLowerCase();
  return locale === 'uk'
    ? `Попередження ${readableCategory} у ${file} позначає патерн, що вже призводив до реальних інцидентів. Відкрийте рядок і простежте, звідки беруться дані.`
    : `This ${readableCategory} alert in ${file} marks a pattern that has caused real incidents before. Open that line and trace where the data comes from.`;
};

const buildCodeSample = (finding: Record<string, unknown>, locale: AppLocale) => {
  const category = String(finding.category || '').toUpperCase();
  const file = String(finding.file || 'the affected file');

  if (category.includes('XSS')) {
    return `// ${file}\n// Before\n<div dangerouslySetInnerHTML={{ __html: userComment }} />\n\n// After\nimport DOMPurify from 'dompurify';\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />`;
  }

  if (category.includes('DEPENDENCY')) {
    const packageName = String(finding.description || '').split(/\s+/)[0] || '<package-name>';
    return locale === 'uk'
      ? `# Перевірити вразливі пакети\nnpm audit\n\n# Оновити залежність\nnpm install ${packageName}@latest`
      : `# Check vulnerable packages\nnpm audit\n\n# Upgrade the affected dependency\nnpm install ${packageName}@latest`;
  }

  if (category.includes('INJECTION') || category.includes('EVAL') || category.includes('CODE_INJECTION')) {
    return `// ${file}\n// Before\nconst result = eval(userInput);\n\n// After\nconst result = parseUserInputSafely(userInput);`;
  }

  const fix = translateText(
    String(finding.fix || (locale === 'uk' ? 'Застосуйте рекомендований безпечний підхід.' : 'Apply the recommended secure pattern for this file.')),
    locale
  );
  return locale === 'uk'
    ? `// ${file}\n// Рекомендований напрямок:\n// ${fix}`
    : `// ${file}\n// Suggested direction:\n// ${fix}`;
};

export const buildLocalizedAiExplanation = (
  finding: Record<string, unknown>,
  locale: AppLocale
): LocalizedAiExplanation => ({
  severity: normalizeSeverity(String(finding.severity || 'LOW')),
  summary: buildSummary(finding, locale),
  risk: buildRisk(finding, locale),
  suggestedFix: translateText(
    String(
      finding.fix ||
        (locale === 'uk'
          ? 'Перевірте код і застосуйте безпечний підхід для цього типу проблеми.'
          : 'Review the flagged code path and apply a secure pattern that matches this issue type.')
    ),
    locale
  ),
  codeSample: buildCodeSample(finding, locale),
  beginnerExplanation: buildBeginnerExplanation(finding, locale)
});

export const localizeAiExplanation = (
  finding: Record<string, unknown>,
  explanation: LocalizedAiExplanation | undefined,
  locale: AppLocale
): LocalizedAiExplanation | undefined => {
  if (!explanation || locale === 'en') {
    return explanation;
  }

  return buildLocalizedAiExplanation(finding, 'uk');
};
