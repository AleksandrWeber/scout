# Scout Architecture

## Overview

Scout is designed as a monorepo with separate frontend and backend packages.

### Backend

- Node.js + Express
- TypeScript
- API endpoint `/api/analyze`
- Services for GitHub repository retrieval, Semgrep, npm audit, and AI analysis

### Frontend

- React + Vite + TypeScript
- Simple dashboard for entering a GitHub URL and viewing findings

### Shared

- Types and interfaces for analysis reports and findings
