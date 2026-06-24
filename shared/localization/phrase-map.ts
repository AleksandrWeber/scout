export const EXACT_PHRASES_UK: Record<string, string> = {
  'Uses dangerouslySetInnerHTML in a React component.':
    'Використовує dangerouslySetInnerHTML у React-компоненті.',
  'This can introduce cross-site scripting if rendered content contains user input.':
    'Може призвести до XSS, якщо вміст містить дані користувача.',
  'Avoid dangerouslySetInnerHTML and use safe JSX rendering or sanitize values before use.':
    'Уникайте dangerouslySetInnerHTML; використовуйте безпечний JSX або санітизацію перед рендером.',
  'dangerouslySetInnerHTML bypasses React built-in escaping and may allow attacker-controlled scripts to execute.':
    'dangerouslySetInnerHTML обходить вбудоване екранування React і може дозволити виконання скриптів зловмисника.',

  'Assigns directly to innerHTML.':
    'Пряме присвоєння innerHTML.',
  'Direct innerHTML assignment can execute malicious HTML or script content from untrusted sources.':
    'Пряме присвоєння innerHTML може виконати шкідливий HTML або скрипт з недовірених джерел.',
  'Use textContent, DOM APIs, or sanitize content before setting innerHTML.':
    'Використовуйте textContent, DOM API або санітизуйте вміст перед записом у innerHTML.',
  'innerHTML writes raw HTML into the DOM and does not escape user input automatically.':
    'innerHTML записує сирий HTML у DOM і не екранує ввід користувача автоматично.',

  'Calls eval() with dynamic input.':
    'Викликає eval() з динамічним вводом.',
  'eval() can execute attacker-controlled strings as code, resulting in remote code execution.':
    'eval() може виконати рядки під контролем зловмисника як код — це загроза RCE.',
  'Remove eval() and use safer alternatives such as JSON.parse or explicit parsing logic.':
    'Приберіть eval() і використовуйте JSON.parse або явний парсинг.',
  'eval is unsafe because it treats strings as executable code and can be manipulated by an attacker.':
    'eval небезпечний, бо виконує рядки як код, який може підмінити зловмисник.',

  'Uses document.write() to insert HTML.':
    'Використовує document.write() для вставки HTML.',
  'document.write can introduce XSS if the inserted content is not strictly controlled.':
    'document.write може спричинити XSS, якщо вміст не контролюється суворо.',
  'Use DOM APIs like createElement and appendChild, or sanitize the written content.':
    'Використовуйте createElement/appendChild або санітизуйте вміст перед записом.',
  'document.write appends HTML directly to the page and should be avoided in modern applications.':
    'document.write додає HTML безпосередньо на сторінку — у сучасних застосунках цього слід уникати.',

  'Constructs code dynamically using new Function().':
    'Динамічно створює код через new Function().',
  'new Function() executes strings as code, which may be controlled by attackers and lead to remote code execution.':
    'new Function() виконує рядки як код; зловмисник може підмінити вміст і отримати RCE.',
  'Avoid dynamic code generation and use explicit functions or parsed data structures instead.':
    'Уникайте динамічної генерації коду; використовуйте явні функції або структури даних.',
  'new Function behaves like eval and opens the same attack surface for injection.':
    'new Function працює як eval і відкриває той самий вектор ін\'єкції.',

  'React dangerouslySetInnerHTML may expose the app to XSS.':
    'React dangerouslySetInnerHTML може відкрити застосунок для XSS.',
  'Assigning to innerHTML may introduce XSS when the value contains untrusted content.':
    'Присвоєння innerHTML може спричинити XSS, якщо значення містить недовірений вміст.',
  'eval() executes code from a string and may allow remote code execution.':
    'eval() виконує код із рядка і може призвести до віддаленого виконання коду.',
  'document.write can inject unsafe HTML into the page.':
    'document.write може вставити небезпечний HTML на сторінку.',
  'new Function() executes a string as code and is equivalent to eval().':
    'new Function() виконує рядок як код — це еквівалент eval().',
  'Shell command execution can lead to command injection when input is not trusted.':
    'Виконання shell-команд може призвести до command injection, якщо ввід недовірений.',
  'Possible hardcoded secret detected in source code.':
    'Можливий захардкоджений секрет у вихідному коді.',
  'postMessage with wildcard target origin can leak data to untrusted frames.':
    'postMessage з wildcard origin може витікати дані до недовірених фреймів.',

  'Remove eval() and replace it with explicit parsing or safer alternatives.':
    'Приберіть eval() і замініть явним парсингом або безпечнішими альтернативами.',
  'eval executes dynamic strings as JavaScript code, which is extremely dangerous.':
    'eval виконує динамічні рядки як JavaScript-код — це надзвичайно небезпечно.',
  'Avoid document.write and use DOM APIs or sanitized content insertion.':
    'Уникайте document.write; використовуйте DOM API або санітизований вміст.',
  'document.write writes raw HTML to the document at runtime and can introduce XSS.':
    'document.write записує сирий HTML у документ під час виконання і може спричинити XSS.',
  'Avoid dynamic code generation and use explicit functions or parsed data structures.':
    'Уникайте динамічної генерації коду; використовуйте явні функції або структури даних.',
  'new Function constructs and executes code from a string, which is dangerous.':
    'new Function створює та виконує код із рядка — це небезпечно.',
  'Avoid shell execution with dynamic input; use safe APIs and strict allowlists.':
    'Уникайте shell-виконання з динамічним вводом; використовуйте безпечні API та allowlist.',
  'child_process exec/spawn runs OS commands and is dangerous with attacker-controlled strings.':
    'child_process exec/spawn запускає OS-команди і небезпечний із рядками під контролем зловмисника.',
  'Move secrets to environment variables or a secret manager and rotate exposed values.':
    'Перенесіть секрети в змінні середовища або secret manager і ротуйте скомпрометовані значення.',
  'Secrets in source code often leak through git history and build artifacts.':
    'Секрети в коді часто потрапляють у git-історію та артефакти збірки.',
  "Specify an explicit target origin instead of '*' when using postMessage.":
    "Вказуйте явний target origin замість '*' у postMessage.",
  'Wildcard origins allow any listener to receive sensitive messages.':
    'Wildcard origin дозволяє будь-якому слухачу отримувати чутливі повідомлення.',
  'innerHTML inserts raw HTML into the DOM without escaping user content.':
    'innerHTML вставляє сирий HTML у DOM без екранування вмісту користувача.',

  'Untrusted input flowing into a dangerous sink can enable XSS or code injection.':
    'Недовірений ввід у небезпечний sink може призвести до XSS або ін\'єкції коду.',
  'Validate and sanitize user input before passing it to DOM APIs or dynamic code execution.':
    'Валідуйте та санітизуйте ввід користувача перед передачею в DOM API або динамічне виконання коду.',
  'AST data-flow analysis tracks values from common user-input sources (req.body, req.query, etc.) to risky sinks.':
    'AST data-flow відстежує значення з джерел вводу (req.body, req.query тощо) до небезпечних sinks.',

  'npm audit found a known vulnerability in a dependency defined by package.json.':
    'npm audit знайшов відому вразливість у залежності з package.json.',
  'A dependency contains a public vulnerability.':
    'Залежність містить публічно відому вразливість.',
  'has a known vulnerability.': 'має відому вразливість.',

  'Review the flagged code path and apply a secure pattern that matches this issue type.':
    'Перевірте позначений фрагмент коду й застосуйте безпечний підхід для цього типу проблеми.',
  'Review the Semgrep finding and apply a safe code pattern.':
    'Перегляньте знахідку Semgrep і застосуйте безпечний патерн коду.',
  'Semgrep identified this pattern as a security risk.':
    'Semgrep ідентифікував цей патерн як ризик безпеки.',
  'Potential security issue detected by Semgrep.':
    'Semgrep виявив потенційну проблему безпеки.',
  'Semgrep detected a problem.': 'Semgrep виявив проблему.'
};
