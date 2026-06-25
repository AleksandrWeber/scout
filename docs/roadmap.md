# Scout Roadmap

## V1 ✅

- GitHub repository analysis
- Semgrep integration
- npm audit integration
- AI explanation service
- Severity classification
- Vulnerability dashboard

## V2 ✅

- [x] AST parsing and data flow analysis (`AST_DATA_FLOW` findings via Babel)
- [x] Dependency risk dashboard (separate tab, package grouping, CVE metadata)
- [x] AI security chat assistant (`POST /api/chat`)
- [x] Expanded Semgrep rules (child_process, secrets, postMessage)
- [x] E2E coverage for tabs, chat, and Clear button
- [x] README and docs updated for V2

## V3

- [ ] Multi-agent review system
- [x] Pull request security review
- [x] OWASP mapping
- [ ] RAG knowledge base
- [x] Dual report types (technical + executive) with project name and scan timestamp
- [x] Generate report UI with preview and share actions (HTML download, print/PDF, email, Telegram, WhatsApp)
- [x] Executive report AI narrative via `POST /api/reports/executive` with local fallback
- [x] Local project scans via CLI (`scout scan <path>`)
- [x] Temporary share links for generated reports (`POST /api/reports/share`, 72h TTL)
- [x] Secrets detection (AWS keys, GitHub tokens, private keys, env literals, hardcoded credentials)
- [x] Local folder scan in web UI (`POST /api/analyze/local`)
- [x] VS Code extension (`Scout: Scan Workspace`)
