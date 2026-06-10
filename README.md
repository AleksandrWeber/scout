# Scout

**AI-powered AppSec assistant for GitHub repositories.**

Scout downloads a JavaScript/TypeScript project, runs security checks, and turns raw findings into a clear dashboard with severity, risk context, and fix guidance.

---

## About

### English

Scout helps developers and security-minded teams quickly review a GitHub repo without setting up a full SAST pipeline. Paste a repository URL, and Scout will:

1. **Download the code** — public repos work out of the box; private repos need a GitHub token.
2. **Scan for issues** — pattern-based checks, Semgrep rules, and `npm audit` for dependency vulnerabilities.
3. **Explain findings with AI** — Gemini or OpenAI generates human-readable summaries, risks, suggested fixes, and beginner-friendly explanations. Without an API key, Scout falls back to contextual local explanations.
4. **Show results in a dashboard** — filter and group by severity or category, expand details per finding, and reset with one click.

Scout V1 focuses on JS/TS/React/Node.js projects and is designed as a practical first step toward AppSec awareness, not a replacement for full penetration testing or enterprise SAST.

### Українська

Scout — це AI-помічник з безпеки додатків для GitHub-репозиторіїв. Вставте посилання на проєкт — і Scout:

1. **Завантажить код** — публічні репозиторії працюють одразу; для приватних потрібен GitHub token.
2. **Просканує проєкт** — патерн-аналіз, правила Semgrep та `npm audit` для залежностей.
3. **Пояснить знахідки через AI** — Gemini або OpenAI формують зрозумілі описи, ризики, рекомендації та пояснення «для початківців». Без API-ключа Scout використовує локальні контекстні пояснення.
4. **Покаже результати в інтерфейсі** — фільтри, групування за severity/категорією, деталі по кожній вразливості, кнопка «Очистити».

Scout V1 орієнтований на JS/TS/React/Node.js і призначений як практичний перший крок до AppSec, а не як заміна повноцінному пентесту чи корпоративному SAST.

---

## Features

- GitHub repo analysis (public and private)
- Static pattern scanning + Semgrep integration
- Dependency vulnerability checks via `npm audit`
- AI explanations (Gemini / OpenAI / local fallback)
- Severity dashboard with filters, search, and grouping
- Collapsible finding cards with file path and line number
- Health and metrics endpoints for observability
- Docker and GHCR deployment support

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Vitest, Playwright |
| **Backend** | Node.js, Express, TypeScript |
| **Security** | Semgrep, npm audit, custom pattern analyzer |
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
| `GEMINI_API_KEY` | Google Gemini API key for AI explanations |
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
├── frontend/     # React + Vite UI
├── backend/      # Express API, analyzers, AI service
├── shared/       # Shared TypeScript types
├── docs/         # Deployment, GitHub token setup, architecture
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

- `GEMINI_API_KEY` — optional, AI explanations
- `OPENAI_API_KEY` — optional, AI explanations
- `GITHUB_TOKEN` — for private repo analysis in CI

Private repo setup guide (Ukrainian): [docs/github-token-setup.md](docs/github-token-setup.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Documentation

- [Deployment](docs/deployment.md)
- [GitHub token setup (UK)](docs/github-token-setup.md)

---

**Scout V1** — scan, understand, and fix security issues in your GitHub repos.
