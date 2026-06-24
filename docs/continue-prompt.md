# Scout — prompt для продовження роботи (handoff)

Скопіюй блок нижче в новий чат Cursor, коли повернешся до проєкту через 2–3 тижні.

---

```
Ти допомагаєш мені з проєктом Scout — навчальним pet-project з AppSec.

## Контекст проєкту

**Scout** — AI-помічник для аналізу безпеки GitHub-репозиторіїв (JS/TS/React/Node.js).

Користувач вставляє URL репо → Scout завантажує код → запускає сканери → показує dashboard з severity, ризиками та AI-поясненнями (як виправити, приклад коду, пояснення для початківців).

**Важливо:**
- Це **навчальний проєкт**, не комерційний продукт. Я вчуся AppSec — до enterprise SAST далеко, і я це розумію.
- Репозиторій: https://github.com/AleksandrWeber/scout
- Актуальна гілка: **`feature/v2`** (V2 complete; merge у `main` — за запитом користувача)
- Секрети (`.env`, API keys) **ніколи не комітити**. Локально: `GEMINI_API_KEY`, `GITHUB_TOKEN`, `AI_PROVIDER=auto`
- Працюємо **покроково**, мінімальні diff, без over-engineering
- Код і UI — англійською; спілкування зі мною — українською

## Стек

| Шар | Технології |
|-----|------------|
| Frontend | React 18, TypeScript, Vite, Vitest, Playwright |
| Backend | Node.js 22, Express, TypeScript |
| Security | Semgrep CLI, npm audit, custom pattern analyzer (~6 regex rules) |
| AI | Google Gemini (default `gemini-2.5-flash`), OpenAI, local contextual fallback |
| DevOps | Docker, docker-compose, GitHub Actions CI, GHCR image build |
| Monorepo | npm workspaces: `frontend/`, `backend/`, `shared/` |

## Що вже зроблено (V1 — готово)

### Backend
- [x] API `POST /api/analyze` — аналіз репо
- [x] GitHub download: public + private (`GITHUB_TOKEN`), cache, retry
- [x] Pattern scanner: XSS, eval, innerHTML, document.write, new Function
- [x] Semgrep integration (`.semgrep.yml`, 5 rules)
- [x] npm audit для dependencies
- [x] AI service: Gemini / OpenAI / local fallback (`backend/src/services/ai.service.ts`)
- [x] Контекстні AI-пояснення — не generic текст (`backend/src/utils/ai-explanation-fallback.ts`, prompt v3)
- [x] Severity normalization (`moderate` → `MEDIUM`)
- [x] Health endpoints: `/health`, `/health/ready`, `/health/metrics`
- [x] Production Dockerfile (Semgrep всередині образу)
- [x] Request logging middleware

### Frontend
- [x] Форма GitHub URL + кнопки Analyze та **Clear**
- [x] Dashboard: severity cards, search, filters, grouping
- [x] Вкладки **Code findings** / **Dependencies** (`ResultsViewTabs`, `DependencyDashboard`)
- [x] AI security chat у VulnerabilityCard (`FindingChatPanel`, `POST /api/chat`)
- [x] Collapsible VulnerabilityCard з file path + line number
- [x] Severity badges: HIGH (red), MEDIUM (yellow), LOW (blue)
- [x] Сортування HIGH → MEDIUM → LOW

### DevOps & docs
- [x] CI: lint, build, unit tests, E2E (Playwright), npm audit, commitlint
- [x] Deploy workflow → GHCR images (`scout-backend`, `scout-frontend`) при push у main
- [x] `docker-compose.prod.yml` — готовий, але **не запущений на сервері**
- [x] README EN/UK, CONTRIBUTING, deployment docs, github-token-setup (UK)

### Як запустити локально
```bash
npm install
brew install semgrep   # обов'язково для повного скану
cp .env.example .env   # додати ключі локально
npm run dev
# UI: http://localhost:5173  |  API: http://localhost:4000/health
```

## Обмеження V1 (свідомі, не баги)

- Тільки **GitHub** URL (`https://github.com/owner/repo`) — немає GitLab, Bitbucket, local upload, zip
- Тільки **JS/TS** стек
- Semgrep потрібен локально (або в Docker-образі на сервері)
- Pattern scan — базовий, не повний SAST
- **Деплою немає** — працює тільки на localhost. Backend готовий (Docker + GHCR), але сервера немає → не деплоїмо поки
- GitHub Pages обговорювали: дасть лише static UI без backend — **не реалізовано**

## Ключові файли

```
backend/src/services/ai.service.ts          # AI explanations
backend/src/utils/ai-explanation-fallback.ts
backend/src/prompts/vulnerability-analysis.prompt.ts
backend/src/services/github.service.ts
backend/src/analyzers/security-analyzer.ts
backend/src/analyzers/dependency-analyzer.ts
backend/src/services/semgrep.service.ts
frontend/src/App.tsx
frontend/src/components/GitHubInput.tsx
frontend/src/components/VulnerabilityCard.tsx
docs/roadmap.md
docs/deployment.md
.github/workflows/ci.yml
.github/workflows/deploy.yml
```

---

## TODO — V2 (наступний пріоритет)

> Мета: глибший аналіз і кращий UX для залежностей + інтерактив з AI.

### AST & data flow
- [x] Дослідити підхід: `@babel/parser`, `typescript` compiler API, або готові lib (e.g. ts-morph) → обрано `@babel/parser` + `@babel/traverse`
- [x] Побудувати AST-аналізатор для JS/TS (`backend/src/analyzers/ast-analyzer.ts`)
- [x] Data flow: відстеження user input → небезпечні sinks (innerHTML, eval, dangerouslySetInnerHTML)
- [x] Інтегрувати AST findings у загальний report (`report.service.ts`, category `AST_DATA_FLOW`)
- [x] Тести для AST analyzer (`backend/tests/ast-analyzer.test.ts`)

### Dependency risk dashboard
- [x] Окремий UI-блок або вкладка для dependency findings (`ResultsViewTabs` + `DependencyDashboard`)
- [x] Показувати: package name, CVE/advisory, affected version, fixed version
- [x] Пріоритизація: severity + exploitability (`priorityScore`, CVSS bonus)
- [x] Групування за пакетом (`groupDependencyFindingsByPackage`)

### AI security chat
- [x] Endpoint `POST /api/chat` — контекстний чат по знаходці
- [x] Frontend: панель чату в розгорнутій VulnerabilityCard (`FindingChatPanel`)
- [x] Prompt: контекст finding + історія діалогу
- [x] Rate limiting / caching для chat (reuse AI slot + cache key)

### V2 — технічний борг / якість
- [x] Розширити Semgrep rules (child_process, secrets, postMessage — 8 rules)
- [x] Прибрати STATIC_SCAN pseudo-finding при порожньому скані
- [x] E2E тести для tabs, chat, Clear
- [x] Оновити README/roadmap після V2

**V2 завершено на гілці `feature/v2`.** Merge у `main` — коли користувач підтвердить.

---

## TODO — V3 (наступний пріоритет)

> Мета: наблизити до повноцінного AppSec workflow.

### Secrets detection
- [ ] Scanner для hardcoded secrets (regex + optional gitleaks/trufflehog integration)
- [ ] Категорія `SECRET` / `CREDENTIAL` у findings
- [ ] AI-пояснення для secrets (вже є заготовки в fallback)

### Pull request security review
- [ ] GitHub App або webhook: аналіз PR diff (не весь репо)
- [ ] Коментарі в PR з findings (GitHub API)
- [ ] Обмежити scan changed files only

### OWASP mapping
- [ ] Мапінг category → OWASP Top 10 (2021)
- [ ] Показувати OWASP tag у VulnerabilityCard і фільтр

### VS Code extension
- [ ] Extension: scan поточного файлу / workspace через Scout API
- [ ] Показ findings inline або в panel

### Multi-agent review + RAG
- [ ] Архітектура: окремі AI agents (triage, explain, suggest fix)
- [ ] RAG: база знань AppSec (OWASP cheatsheets, docs) — vector store або file-based
- [ ] Дослідити: LangChain / власна реалізація / Gemini file search

---

## TODO — Деплой (коли з'явиться сервер, не зараз)

- [ ] Орендувати VPS або Render/Railway
- [ ] Запустити `docker compose -f docker-compose.prod.yml up -d` з `.env` на сервері
- [ ] (Опційно) GitHub Pages для frontend + `VITE_API_URL` на backend URL
- [ ] Перевірити Semgrep у production container
- [ ] Не пушити secrets; rotate keys після деплою

---

## Узгоджені рішення з попередніх сесій

1. AI prompt має бути **людяним** — не повторювати description/risk сканера дослівно
2. Local fallback — **контекстний** по category (XSS, dependency, injection), не один шаблон
3. Кнопка **Clear** скидає форму + результати; in-flight analyze request ігнорується
4. Commits — тільки коли я прошу; PR через `gh`
5. Не amend/push --force без явного запиту
6. `feature/v2` — V2 complete; merge у **main** за запитом користувача

---

Почни з того, що я скажу в першому повідомленні. Якщо я не вказав версію — запропонуй наступний логічний крок з V2 TODO і працюй покроково.
```
