# Secret handling for CI and local development

- Local: create a `.env` file in the project root (gitignored) with:
  - `GITHUB_TOKEN=...`
  - `OPENAI_API_KEY=...` (optional)
  - `GEMINI_API_KEY=...` (optional)
  - `AI_PROVIDER=gemini|openai|auto`
  - `GEMINI_MODEL=gemini-2.5-flash`

- GitHub Actions: add secrets in **Settings → Secrets and variables → Actions**:
  - `GEMINI_API_KEY` (optional)
  - `OPENAI_API_KEY` (optional)
  - `GITHUB_TOKEN` (optional)

  The workflow reads them as `${{ secrets.GEMINI_API_KEY }}` etc. — never hardcode keys in `.yml` files.

- Docker / Deploy: prefer Docker secrets or environment variables injected by your orchestration (e.g., Kubernetes secrets).

Security notes:

- Never commit `.env` or real API keys to git. Only placeholders belong in `.env.example`.
- Never paste API keys into chat, issues, or pull requests.
- Limit token scope: use least privilege for `GITHUB_TOKEN`.
- If a key is exposed, rotate it immediately in Google AI Studio / OpenAI / GitHub.
