# Secret handling for CI and local development

- Local: create a `.env` file in `backend/` (gitignored) with:
  - `GITHUB_TOKEN=...`
  - `OPENAI_API_KEY=...`

- GitHub Actions: add `OPENAI_API_KEY` and `GITHUB_TOKEN` in repository Settings → Secrets → Actions. Example workflow uses `${{ secrets.OPENAI_API_KEY }}`.

- Docker / Deploy: prefer Docker secrets or environment variables injected by your orchestration (e.g., Kubernetes secrets).

Security notes:

- Never commit `.env` or secrets to git.
- Limit token scope: use least privilege for `GITHUB_TOKEN`.
