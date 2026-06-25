# Scout

**AI-powered AppSec assistant for GitHub repositories.**

Scout downloads a JavaScript/TypeScript project, runs security checks, and turns raw findings into a clear dashboard with severity, risk context, fix guidance, and an interactive AI assistant.

---

## What Scout does

### English

Scout is a learning-focused security scanner for **GitHub repositories** (JS/TS/React/Node.js). Paste a repo URL and Scout will:

#### 1. Download and analyze the repository

- **Public repos** work immediately.
- **Private repos** require `GITHUB_TOKEN` in the backend `.env`.
- Supported input: `https://github.com/owner/repo` URLs only.

#### 2. Run multiple security checks

| Layer | What it detects |
|-------|-----------------|
| **Pattern scanner** | `eval`, `innerHTML`, `document.write`, `new Function`, and similar risky patterns |
| **Semgrep** (8 custom rules) | XSS (`dangerouslySetInnerHTML`, `innerHTML`), code injection (`eval`, `new Function`, `child_process`), hardcoded secrets, insecure `postMessage` |
| **AST data-flow** (Babel) | User input flowing into dangerous sinks (`req.body`, `event.target.value` → `eval`, `innerHTML`, `dangerouslySetInnerHTML`, `document.write`) — category `AST_DATA_FLOW` |
| **npm audit** | Known vulnerabilities in dependencies (CVE, affected/fixed versions, exploit hints) |
| **Secrets scanner** | AWS keys, GitHub tokens, private keys, JWT-like strings, hardcoded credentials, sensitive `.env` values |

Semgrep CLI must be installed locally (or available inside the Docker image) for full static analysis.

#### 3. Explain findings with AI

For each code finding, Scout can generate:

- Human-readable **summary** and **risk** (not a copy-paste of the scanner text)
- **Suggested fix** with optional **code sample**
- **Beginner-friendly explanation**

Providers: **Google Gemini** (default), **OpenAI**, or a **local contextual fallback** when no API key is set.

#### 4. Chat about a finding

- Expand a vulnerability card and ask follow-up questions in natural language (e.g. *"How do I fix this?"*, *"Why is this dangerous?"*).
- Endpoint: `POST /api/chat` — context-aware replies based on the finding and conversation history.
- Chat is **hidden** for informational scan messages (not real file-level vulnerabilities).

#### 5. Explore results in the dashboard

**Two tabs:**

- **Code findings** — static analysis, Semgrep, and AST results
- **Dependencies** — `npm audit` results grouped by package

**Code tab tools:**

- Severity summary cards (HIGH / MEDIUM / LOW) — click to filter
- Search across file, category, description
- Filter by severity and category
- Group by severity, category, file, or none
- Collapsible cards with file path, line number, description, risk, fix, education, and AI explanation

**Dependencies tab:**

- Package grouping with highest severity and priority score
- CVE IDs, affected versions, patched version, exploit-likelihood flag
- Per-advisory details and fix notes

**Other UI:**

- **Clear** — reset the form and all results
- **Language** — English (default) or Ukrainian; choice is saved in the browser
- **Theme** — light (default) or dark; choice is saved in the browser
- On first visit: English + light theme. Returning users get their saved preferences.

#### 6. API and operations

- `POST /api/analyze` — full repository scan
- `POST /api/chat` — security chat for a finding
- `GET /health`, `/health/ready`, `/health/metrics` — health and observability
- Docker images and GitHub Actions CI; production images on GHCR (see [docs/deployment.md](docs/deployment.md))

> Scout is a **practical learning tool**, not a replacement for enterprise SAST or penetration testing.

---

### Українська

Scout — навчальний сканер безпеки для **GitHub-репозиторіїв** (JS/TS/React/Node.js). Вставте URL репозиторію — і Scout:

#### 1. Завантажить і проаналізує репозиторій

- **Публічні репозиторії** працюють одразу.
- **Приватні** потребують `GITHUB_TOKEN` у backend `.env`.
- Підтримується лише формат URL: `https://github.com/owner/repo`.

#### 2. Запустить кілька перевірок безпеки

| Шар | Що виявляє |
|-----|------------|
| **Pattern scanner** | `eval`, `innerHTML`, `document.write`, `new Function` та подібні небезпечні патерни |
| **Semgrep** (8 власних правил) | XSS (`dangerouslySetInnerHTML`, `innerHTML`), ін'єкції коду (`eval`, `new Function`, `child_process`), захардкоджені секрети, небезпечний `postMessage` |
| **AST data-flow** (Babel) | Потік user input у небезпечні sinks (`req.body`, `event.target.value` → `eval`, `innerHTML`, `dangerouslySetInnerHTML`, `document.write`) — категорія `AST_DATA_FLOW` |
| **npm audit** | Відомі вразливості в залежностях (CVE, уразливі/виправлені версії, ознаки exploit) |

Для повного статичного аналізу потрібен Semgrep CLI локально (або в Docker-образі).

#### 3. Пояснить знахідки через AI

Для кожної знахідки в коді Scout може згенерувати:

- Зрозумілий **опис** і **ризик** (не дослівне копіювання тексту сканера)
- **Рекомендоване виправлення** з опційним **прикладом коду**
- **Пояснення для початківців**

Провайдери: **Google Gemini** (за замовчуванням), **OpenAI** або **локальний контекстний fallback** без API-ключа.

#### 4. Чат по знахідці

- Розгорніть картку вразливості й поставте уточнювальні питання (наприклад: *«Як це виправити?»*, *«Чому це небезпечно?»*).
- Endpoint: `POST /api/chat` — відповіді з урахуванням знахідки та історії діалогу.
- Чат **прихований** для інформаційних повідомлень сканера (не реальні вразливості у файлі).

#### 5. Покаже результати в інтерфейсі

**Дві вкладки:**

- **Знахідки в коді** — статичний аналіз, Semgrep і AST
- **Залежності** — результати `npm audit`, згруповані за пакетом

**Інструменти вкладки коду:**

- Картки за рівнем загрози (HIGH / MEDIUM / LOW) — клік для фільтрації
- Пошук за файлом, категорією, описом
- Фільтр за severity і категорією
- Групування за рівнем загрози, категорією, файлом або без групування
- Згортані картки з шляхом до файлу, номером рядка, описом, ризиком, виправленням, довідкою та AI-поясненням

**Вкладка залежностей:**

- Групування за пакетом з найвищим severity і priority score
- CVE, уразливі версії, версія з виправленням, ознака ймовірного exploit
- Деталі по кожному advisory і рекомендації з виправлення

**Інше в UI:**

- **Очистити** — скинути форму та всі результати
- **Мова** — англійська (за замовчуванням) або українська; вибір зберігається в браузері
- **Тема** — світла (за замовчуванням) або темна; вибір зберігається в браузері
- Перший візит: англійська + світла тема. При наступних відкриттях — збережені налаштування.

> Тексти знахідок з backend (опис, ризик, fix від сканера) залишаються мовою аналізатора — зазвичай англійською. Інтерфейс перекладається повністю; технічні ідентифікатори (`CVE`, `XSS`, `Semgrep`, `HIGH`/`MEDIUM`/`LOW`, шляхи до файлів) залишаються в оригіналі.

#### 6. API та експлуатація

- `POST /api/analyze` — повний скан репозиторію
- `POST /api/chat` — security-чат по знахідці
- `GET /health`, `/health/ready`, `/health/metrics` — health та observability
- Docker-образи та GitHub Actions CI; production-образи в GHCR (див. [docs/deployment.md](docs/deployment.md))

> Scout — **навчальний інструмент**, а не заміна enterprise SAST чи пентесту.

---

## Features (summary)

- GitHub repo analysis (public and private)
- Pattern scanning + 8 Semgrep rules + AST data-flow analysis
- Dependency dashboard (`npm audit`) with CVE metadata and priority scoring
- AI explanations and per-finding security chat (Gemini / OpenAI / local fallback)
- Bilingual UI: **English** and **Ukrainian** (saved in browser)
- **Light** and **dark** theme (saved in browser)
- Severity dashboard with search, filters, and grouping
- Collapsible finding cards with file path and line number
- Clear button to reset the form and results
- Health and metrics endpoints
- Docker and GHCR deployment support

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Vitest, Playwright |
| **Backend** | Node.js, Express, TypeScript |
| **Security** | Semgrep, npm audit, pattern scan, AST data-flow (Babel) |
| **AI** | Google Gemini, OpenAI (optional) |
| **DevOps** | Docker, Docker Compose, GitHub Actions, GHCR |
| **Monorepo** | npm workspaces (`frontend`, `backend`, `shared`) |

## Prerequisites

- **Node.js 22+**
- **npm**
- **Semgrep CLI** — required for full static analysis

```bash
brew install semgrep
# or
pip install semgrep
```

## Quick start

1. Clone and install:

```bash
git clone https://github.com/AleksandrWeber/scout.git
cd scout
npm install
```

2. Configure environment (optional but recommended):

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for AI explanations and chat |
| `OPENAI_API_KEY` | OpenAI API key (alternative AI provider) |
| `AI_PROVIDER` | `auto` (default), `gemini`, or `openai` |
| `GITHUB_TOKEN` | Required for **private** repositories |

3. Run locally:

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Health check:** http://localhost:4000/health

### Scan a local project (CLI, V3)

Scout can scan a **folder on your machine** without GitHub:

```bash
npm run scout:scan -- ./path/to/your-project
npm run scout:scan -- ./path/to/your-project --json
npm run scout:scan -- ./path/to/your-project --no-ai --locale uk
```

After `npm run build:backend`, you can also use:

```bash
cd backend && node dist/cli/scan.js scan ./path/to/your-project
```

Use `--no-ai` for faster offline scans. Use `--json` for the full report payload.

### Local folder in the web UI

In the Scout UI, switch **Local folder** and paste a path such as `./my-project` or `/Users/you/projects/my-app`. The backend must run on the same machine and be allowed to read that directory (`SCOUT_ALLOW_LOCAL_PATHS=false` disables this).

### VS Code extension

```bash
cd extension
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host, then run **Scout: Scan Workspace**. See [extension/README.md](extension/README.md).

## Docker

Development:

```bash
npm run docker:up
```

Production-style setup:

```bash
npm run docker:prod
```

Production images are published to GHCR on pushes to `main`. See [docs/deployment.md](docs/deployment.md).

## Project structure

```
scout/
├── frontend/     # React + Vite UI (i18n, themes, dashboard)
├── backend/      # Express API, analyzers, AI service
├── shared/       # Shared TypeScript types
├── docs/         # Deployment, GitHub token setup, architecture, roadmap
└── .github/      # CI/CD workflows
```

## Testing

```bash
npm run test:backend      # Jest
npm run test:frontend     # Vitest
npm run test:e2e          # Playwright
npm run lint              # ESLint (frontend + backend)
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push and pull requests to `main`:

- dependency audit
- lint and build (frontend + backend)
- unit and E2E tests
- commitlint on PRs

Set these secrets in GitHub → Settings → Secrets → Actions:

- `GEMINI_API_KEY` — optional, AI explanations and chat
- `OPENAI_API_KEY` — optional, AI explanations and chat
- `GITHUB_TOKEN` — for private repo analysis in CI

Private repo setup guide (Ukrainian): [docs/github-token-setup.md](docs/github-token-setup.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Documentation

- [Roadmap](docs/roadmap.md)
- [Deployment](docs/deployment.md)
- [GitHub token setup (UK)](docs/github-token-setup.md)

---

**Scout V2** — scan, understand, fix, and discuss security issues in your GitHub repos.
