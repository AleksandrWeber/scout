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

## Project structure

- `frontend/` — React + Vite UI
- `backend/` — Express API and security analysis services
- `shared/` — shared TypeScript types and constants
- `docs/` — architecture and roadmap documentation

## CI and GitHub Actions

This project includes a GitHub Actions workflow at `.github/workflows/ci.yml`.

The workflow runs on push and pull request to `main`, installs backend dependencies, and executes the backend Jest tests.

### Required secrets

Set the following repository secrets in GitHub Settings → Secrets → Actions:

- `OPENAI_API_KEY` — optional; enables OpenAI-based vulnerability explanations.
- `GEMINI_API_KEY` — optional; enables Google Gemini explanations (preferred when `AI_PROVIDER=auto`).
- `GITHUB_TOKEN` — used for repository access and archive downloads when needed.

Set `AI_PROVIDER` to `gemini`, `openai`, or `auto` (default). When no AI key is configured, Scout runs in local AI fallback mode and generates basic explanation text from the detected findings.

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
