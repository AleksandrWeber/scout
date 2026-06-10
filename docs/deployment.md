# Deployment

Scout ships production Docker images via GitHub Actions to **GitHub Container Registry (GHCR)**.

Images are built when changes are pushed to `main`, when a version tag like `v1.0.0` is created, or when the **Deploy** workflow is run manually.

## Image names

For repository `AleksandrWeber/scout`:

- `ghcr.io/aleksandweber/scout-backend:latest`
- `ghcr.io/aleksandweber/scout-frontend:latest`

Each deploy also publishes immutable tags with the git commit SHA.

## One-time setup

1. Merge Scout into `main`.
2. Run the **Deploy** workflow once (or push to `main`).
3. In GitHub → **Packages**, open each package and set visibility:
   - **Public** for open-source demos
   - **Private** if you do not want public image pulls

No extra registry password is required for GitHub Actions — the workflow uses `GITHUB_TOKEN` with `packages: write`.

## Deploy on a server with Docker Compose

1. Copy these files to the server:
   - `docker-compose.prod.yml`
   - `.env` (create on the server, never commit)

2. Set image names if needed:

```env
SCOUT_BACKEND_IMAGE=ghcr.io/aleksandweber/scout-backend:latest
SCOUT_FRONTEND_IMAGE=ghcr.io/aleksandweber/scout-frontend:latest
```

3. Pull and start:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

4. Open:
   - Frontend: http://localhost:5173
   - Backend health: http://localhost:4000/health

## Required environment variables

Create `.env` on the server:

```env
GITHUB_TOKEN=...
GEMINI_API_KEY=...
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
PORT=4000
```

See also:

- [github-token-setup.md](./github-token-setup.md)
- [secret-handling.md](./secret-handling.md)

## Local production-style run (without GHCR)

Build and run from source on the same machine:

```bash
npm run docker:prod
```

## Release tagging

Create a semver tag to mark a release build:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The Deploy workflow publishes images tagged with the commit SHA. You can retag a SHA image to `v0.2.0` in GHCR if needed.

## Security notes

- Never bake API keys or tokens into Docker images.
- Inject secrets at runtime through `.env`, Docker secrets, or your cloud provider.
- Rotate tokens used in production separately from local development tokens.
