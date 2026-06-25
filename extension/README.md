# Scout VS Code Extension

Scan the current workspace with your local Scout backend.

## Prerequisites

1. Scout backend running on `http://localhost:4000`
2. Scout frontend optional at `http://localhost:5173`
3. `SCOUT_ALLOW_LOCAL_PATHS` not set to `false`

## Development

```bash
cd extension
npm install
npm run compile
```

Then press **F5** in VS Code to launch an Extension Development Host.

## Command

- **Scout: Scan Workspace** — runs `POST /api/analyze/local` against the opened folder

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `scout.backendUrl` | `http://localhost:4000` | Scout API base URL |
| `scout.uiUrl` | `http://localhost:5173` | Scout web UI |
| `scout.openUiAfterScan` | `true` | Open UI after scan |
