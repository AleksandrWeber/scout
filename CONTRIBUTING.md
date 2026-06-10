# Contributing to Scout

Thank you for helping improve Scout. This project is an AI-powered AppSec assistant for JavaScript, TypeScript, React, and Node.js projects.

## Before you start

1. Read the [README](README.md)
2. Never commit secrets (`.env`, API keys, tokens)
3. For private GitHub repository support, see [docs/github-token-setup.md](docs/github-token-setup.md)

## Development setup

```bash
npm install
pip install semgrep   # or: brew install semgrep
cp .env.example .env  # add local keys only on your machine
npm run dev
```

Useful commands:

```bash
npm run lint
npm run test:backend
npm run test:frontend -- --run
npm run test:e2e
npm run build:backend
npm run build:frontend
npm run docker:up
```

## Branch workflow

1. Create a feature branch from `main`
2. Make focused changes with tests when behavior changes
3. Run lint and tests locally
4. Open a pull request into `main`

## Commit message format

Scout uses [Conventional Commits](https://www.conventionalcommits.org/):

```text
type(scope): short description
```

Examples:

```text
feat(frontend): add severity filter to findings toolbar
fix(backend): handle missing GitHub token for private repos
docs: add deployment guide for GHCR
test(backend): cover repository archive cache hits
ci: run commitlint on pull requests
```

Allowed types include:

- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `ci`
- `chore`
- `build`

Validate the latest commit locally:

```bash
npm run commitlint
```

## Pull requests

Use the PR template and include:

- What changed and why
- How you tested it
- Screenshots for UI changes when relevant
- Confirmation that no secrets were added

CI must pass before merge.

## Code guidelines

- Keep changes small and focused
- Match existing project structure and naming
- Prefer clear error messages for developer-facing flows
- Do not add unrelated refactors in the same PR

## Security

If you find a security issue, do not open a public issue with exploit details. Rotate exposed credentials immediately and report responsibly to the maintainers.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
