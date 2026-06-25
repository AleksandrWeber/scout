# Scout

**AI-powered AppSec assistant for GitHub repositories, pull requests, and local projects.**

Scout runs deterministic security scanners, maps findings to **OWASP Top 10 2021**, enriches results with AI explanations, and helps you explore, discuss, and share results through a bilingual web UI, CLI, and VS Code extension.

---

## What Scout does

### English

Scout is a learning-focused security scanner for **JavaScript/TypeScript** projects (React, Node.js). You can scan from several entry points:

| Entry point | How |
|-------------|-----|
| **GitHub repo** | Paste `https://github.com/owner/repo` in the web UI or `POST /api/analyze` |
| **Pull request** | Paste PR URL in the UI or `POST /api/analyze/pr` — scans **only changed files** |
| **Local folder** | Web UI tab, CLI (`scout scan <path>`), or VS Code **Scout: Scan Workspace** |
| **VS Code** | Extension calls the local backend API — see [extension/README.md](extension/README.md) |

Public GitHub repos work without setup. Private repos and PR review work best with `GITHUB_TOKEN` in the backend `.env`.

#### 1. Run security checks (multi-agent pipeline)

Two deterministic agents run **in parallel**, then findings are deduplicated:

| Agent | Checks |
|-------|--------|
| **Supply chain** | Secrets scanner + `npm audit` (dependencies) |
| **Code security** | Pattern scanner + Semgrep (8 custom rules) + AST data-flow (Babel) |

| Layer | What it detects |
|-------|-----------------|
| **Pattern scanner** | `eval`, `innerHTML`, `document.write`, `new Function`, and similar risky patterns |
| **Semgrep** | XSS (`dangerouslySetInnerHTML`, `innerHTML`), code injection (`eval`, `new Function`, `child_process`), hardcoded secrets, insecure `postMessage` |
| **AST data-flow** | User input flowing into dangerous sinks — category `AST_DATA_FLOW` |
| **npm audit** | Known vulnerabilities in dependencies (CVE, affected/fixed versions, exploit hints) |
| **Secrets scanner** | AWS keys, GitHub tokens, private keys, JWT-like strings, hardcoded credentials, sensitive `.env` values |

An optional **synthesis agent** (when AI is enabled) prioritizes findings across agents **without inventing new issues**. The UI shows an **Multi-agent review** panel with per-agent status and synthesis priorities.

Semgrep CLI must be installed locally (or in Docker) for full static analysis.

#### 2. Classify and explain findings

- **OWASP Top 10 2021** mapping on each finding (e.g. `A03:2021 Injection`) — shown in the UI and technical reports.
- **AI explanations** per finding: summary, risk, suggested fix, code sample, beginner explanation.
- Providers: **Google Gemini** (default), **OpenAI**, or **local contextual fallback** without an API key.

#### 3. Chat with RAG knowledge base

- Expand a finding card and ask follow-up questions (`POST /api/chat`).
- Answers are grounded in a **local markdown knowledge base** (`docs/knowledge/`) via keyword retrieval — works offline, no embedding API required.
- Chat shows which knowledge articles were used. Chat is hidden for informational scan messages only.

#### 4. Explore results in the dashboard

**Scan modes in the UI:** GitHub · Local folder · Pull request

**Two result tabs:**

- **Code findings** — static analysis, Semgrep, AST, secrets
- **Dependencies** — `npm audit` grouped by package

**Tools:** severity cards, search, filters, grouping, collapsible cards (severity, category, OWASP badge, file, line, fix, AI explanation).

**Preferences:** English / Ukrainian UI, light / dark theme (saved in browser).

#### 5. Generate and share reports

After a scan, generate:

- **Technical report** (AppSec) — detailed findings, OWASP mapping, CVE data, fix notes
- **Executive summary** (plain language) — for non-technical stakeholders

Share via HTML download, print/PDF, email, Telegram, WhatsApp, or a **temporary share link** (72h TTL, `POST /api/reports/share`).

#### 6. API overview

| Endpoint | Purpose |
|----------|---------|
| `POST /api/analyze` | Full GitHub repository scan |
| `POST /api/analyze/local` | Local folder scan |
| `POST /api/analyze/pr` | Pull request scan (changed files only) |
| `POST /api/chat` | Security chat for a finding (with RAG) |
| `POST /api/reports/executive` | Executive narrative for a scan |
| `POST /api/reports/share` | Create temporary report share link |
| `GET /api/reports/shared/:token` | Open shared report |
| `GET /api/knowledge/search?q=` | Search knowledge base |
| `GET /health`, `/health/ready`, `/health/metrics` | Health and observability |

> Scout is a **practical learning tool**, not a replacement for enterprise SAST or penetration testing.

---

### Українська

Scout — навчальний сканер безпеки для проєктів **JavaScript/TypeScript** (React, Node.js). Сканувати можна кількома способами:

| Точка входу | Як |
|-------------|-----|
| **GitHub-репозиторій** | URL у веб-UI або `POST /api/analyze` |
| **Pull request** | URL PR у UI або `POST /api/analyze/pr` — лише **змінені файли** |
| **Локальна папка** | Вкладка в UI, CLI (`scout scan <шлях>`) або VS Code **Scout: Scan Workspace** |
| **VS Code** | Розширення викликає локальний backend — див. [extension/README.md](extension/README.md) |

Публічні репозиторії працюють без налаштувань. Для приватних і PR review рекомендується `GITHUB_TOKEN` у backend `.env`.

#### 1. Перевірки безпеки (багатоагентний pipeline)

Два детерміновані агенти працюють **паралельно**, потім знахідки дедуплікуються:

| Агент | Перевірки |
|-------|-----------|
| **Ланцюг постачання** | Сканер секретів + `npm audit` (залежності) |
| **Безпека коду** | Pattern scanner + Semgrep (8 правил) + AST data-flow (Babel) |

| Шар | Що виявляє |
|-----|------------|
| **Pattern scanner** | `eval`, `innerHTML`, `document.write`, `new Function` та подібні патерни |
| **Semgrep** | XSS, ін'єкції коду (`eval`, `child_process`), секрети, небезпечний `postMessage` |
| **AST data-flow** | Потік user input у небезпечні sinks — категорія `AST_DATA_FLOW` |
| **npm audit** | Відомі вразливості в залежностях (CVE, версії, exploit) |
| **Сканер секретів** | AWS keys, GitHub tokens, приватні ключі, JWT-подібні рядки, credentials у коді, `.env` |

Опційний **synthesis-агент** (якщо увімкнено AI) узгоджує пріоритети **без вигадування нових проблем**. У UI — панель **багатоагентного огляду** зі статусом агентів і пріоритетами.

Для повного статичного аналізу потрібен Semgrep CLI локально (або в Docker).

#### 2. Класифікація та пояснення знахідок

- Мапінг на **OWASP Top 10 2021** (наприклад, `A03:2021 Injection`) — у UI та технічних звітах.
- **AI-пояснення**: опис, ризик, виправлення, приклад коду, пояснення для початківців.
- Провайдери: **Google Gemini**, **OpenAI** або **локальний fallback** без API-ключа.

#### 3. Чат із RAG-базою знань

- Розгорніть картку знахідки й поставте питання (`POST /api/chat`).
- Відповіді підкріплюються **локальною markdown-базою** (`docs/knowledge/`) — keyword-пошук, офлайн.
- У чаті видно, які статті з бази використано. Чат прихований лише для інформаційних повідомлень сканера.

#### 4. Результати в інтерфейсі

**Режими скану в UI:** GitHub · Локальна папка · Pull request

**Дві вкладки:** знахідки в коді · залежності

**Інструменти:** картки severity, пошук, фільтри, групування, згортані картки (severity, категорія, бейдж OWASP, файл, рядок, fix, AI).

**Налаштування:** англійська / українська, світла / темна тема (зберігаються в браузері).

> Тексти знахідок з backend (опис, ризик, fix) зазвичай англійською. UI перекладається повністю; `CVE`, `XSS`, `Semgrep`, шляхи до файлів — в оригіналі.

#### 5. Звіти та поширення

Після скану можна згенерувати:

- **Технічний звіт** (AppSec) — детальні знахідки, OWASP, CVE, рекомендації
- **Executive summary** (простою мовою) — для нетехнічної аудиторії

Поширення: HTML, друк/PDF, email, Telegram, WhatsApp або **тимчасове посилання** (72 год, `POST /api/reports/share`).

#### 6. API

| Endpoint | Призначення |
|----------|-------------|
| `POST /api/analyze` | Скан GitHub-репозиторію |
| `POST /api/analyze/local` | Скан локальної папки |
| `POST /api/analyze/pr` | Скан pull request (лише змінені файли) |
| `POST /api/chat` | Security-чат по знахідці (з RAG) |
| `POST /api/reports/executive` | Executive narrative |
| `POST /api/reports/share` | Тимчасове посилання на звіт |
| `GET /api/reports/shared/:token` | Відкрити shared-звіт |
| `GET /api/knowledge/search?q=` | Пошук у базі знань |
| `GET /health`, `/health/ready`, `/health/metrics` | Health та observability |

> Scout — **навчальний інструмент**, а не заміна enterprise SAST чи пентесту.

---

## Features (summary)

- **Scan targets:** GitHub repo, pull request (changed files), local folder
- **Entry points:** web UI, CLI (`scout scan`), VS Code extension
- **Scanners:** patterns, Semgrep, AST data-flow, npm audit, secrets detection
- **Multi-agent pipeline:** supply-chain + code-security agents, optional synthesis
- **OWASP Top 10 2021** mapping on findings
- **RAG knowledge base** for chat and report narratives (offline keyword retrieval)
- **Reports:** technical + executive HTML, share links (72h)
- **AI:** explanations, chat, executive/synthesis narratives (Gemini / OpenAI / local fallback)
- **UI:** bilingual (EN/UK), light/dark theme, severity dashboard, filters, grouping
- **Ops:** health/metrics, Docker, GHCR, GitHub Actions CI

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Vitest, Playwright |
| **Backend** | Node.js, Express, TypeScript |
| **Extension** | VS Code Extension API |
| **Security** | Semgrep, npm audit, pattern scan, AST (Babel), secrets rules |
| **AI / RAG** | Gemini, OpenAI (optional), local markdown knowledge base |
| **DevOps** | Docker, Docker Compose, GitHub Actions, GHCR |
| **Monorepo** | npm workspaces (`frontend`, `backend`, `shared`) |

## Prerequisites

- **Node.js 22+**
- **npm**
- **Semgrep CLI** — recommended for full static analysis

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
| `GEMINI_API_KEY` | Google Gemini — AI explanations, chat, reports |
| `OPENAI_API_KEY` | OpenAI (alternative AI provider) |
| `AI_PROVIDER` | `auto` (default), `gemini`, or `openai` |
| `GITHUB_TOKEN` | Private repos, PR review, higher API limits |
| `SCOUT_ALLOW_LOCAL_PATHS` | Set `false` to disable local path scans on the server |
| `SCOUT_RAG_ENABLED` | Set `false` to disable knowledge-base retrieval |
| `SCOUT_KNOWLEDGE_DIR` | Custom path to markdown knowledge docs |
| `SCOUT_RAG_TOP_K` | Number of knowledge chunks to retrieve (default `3`) |
| `SCOUT_PR_MAX_FILES` | Max changed files per PR scan (default `200`) |

3. Run locally:

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Health check:** http://localhost:4000/health

### CLI

```bash
npm run scout:scan -- ./path/to/your-project
npm run scout:scan -- ./path/to/your-project --json
npm run scout:scan -- ./path/to/your-project --no-ai --locale uk
```

### Pull request (API example)

```bash
curl -X POST http://localhost:4000/api/analyze/pr \
  -H 'Content-Type: application/json' \
  -d '{"pullRequestUrl":"https://github.com/owner/repo/pull/42","locale":"en"}'
```

### VS Code extension

```bash
cd extension && npm install && npm run compile
```

Press **F5**, then run **Scout: Scan Workspace**. Configure `scout.backendUrl` in settings if needed.

## Docker

```bash
npm run docker:up      # development
npm run docker:prod    # production-style
```

Production images on GHCR — see [docs/deployment.md](docs/deployment.md).

## Project structure

```
scout/
├── frontend/     # React UI (i18n, themes, dashboard, reports)
├── backend/      # Express API, analyzers, agents, RAG, CLI
├── extension/    # VS Code extension
├── shared/       # Types, reports, OWASP, agents, RAG, localization
├── docs/         # Deployment, knowledge base, roadmap
└── .github/      # CI/CD workflows
```

## Testing

```bash
npm run test:backend      # Jest
npm run test:frontend     # Vitest
npm run test:e2e          # Playwright
npm run lint              # ESLint
```

## CI

GitHub Actions on push/PR to `main`: audit, lint, build, unit + E2E tests, commitlint.

Optional secrets: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GITHUB_TOKEN`.

Private repo setup: [docs/github-token-setup.md](docs/github-token-setup.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Documentation

- [Roadmap](docs/roadmap.md)
- [Deployment](docs/deployment.md)
- [GitHub token setup (UK)](docs/github-token-setup.md)
- [Knowledge base](docs/knowledge/)

---

**Scout V3** — scan, understand, prioritize, report, and discuss security in your code.
