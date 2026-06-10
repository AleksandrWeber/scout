# Scout

Scout is an AI-powered AppSec Assistant for JavaScript, TypeScript, React, and Node.js projects.

## Overview

- Clone a GitHub repository
- Run Semgrep and npm audit
- Generate a security report
- Display vulnerabilities with severity, explanation, and fix guidance

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Install Semgrep CLI on your machine:

```bash
pip install semgrep
# or
brew install semgrep
```

3. Run backend and frontend:

```bash
npm run dev
```

### Run with Docker (optional)

1. Create `.env` in the project root (see `.env.example`).
2. Start Scout in development mode:

```bash
npm run docker:up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

Production-style containers:

```bash
npm run docker:prod
```

Production images are published to GHCR when `main` is updated. See [docs/deployment.md](docs/deployment.md).

## Project structure

- `frontend/` — React + Vite UI
- `backend/` — Express API, security analysis, health endpoints (`/health`, `/health/ready`, `/health/metrics`)
- `shared/` — shared TypeScript types and constants
- `docs/` — architecture and roadmap documentation

## CI and GitHub Actions

This project includes a GitHub Actions workflow at `.github/workflows/ci.yml`.

The workflow runs on push and pull request to `main`, installs backend dependencies, and executes the backend Jest tests.

### Required secrets

Set the following repository secrets in GitHub Settings → Secrets → Actions:

- `OPENAI_API_KEY` — optional; enables OpenAI-based vulnerability explanations.
- `GEMINI_API_KEY` — optional; enables Google Gemini explanations (preferred when `AI_PROVIDER=auto`).
- `GITHUB_TOKEN` — required for **private** repository downloads. See [docs/github-token-setup.md](docs/github-token-setup.md).

Set `AI_PROVIDER` to `gemini`, `openai`, or `auto` (default). When no AI key is configured, Scout runs in local AI fallback mode and generates basic explanation text from the detected findings.

### Private GitHub repositories

Public repositories work without a token. Private repositories require `GITHUB_TOKEN` in the root `.env` file.

Step-by-step guide: [docs/github-token-setup.md](docs/github-token-setup.md)

### Run locally

```bash
cd backend
npm install
npm test
```

### Workflow file

The GitHub Actions workflow is configured to:

- checkout the repository
- install Node.js 22
- install backend dependencies
- run `npm test`

You can extend the workflow later with frontend build or linting steps.
