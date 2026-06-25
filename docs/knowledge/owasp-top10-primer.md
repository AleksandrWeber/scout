# OWASP Top 10 2021 — Scout mapping primer

Scout maps findings to OWASP Top 10 2021 categories to help prioritize fixes in plain language.

## Common mappings in Scout

- **A02 Cryptographic Failures** — hardcoded secrets, weak handling of sensitive data.
- **A03 Injection** — XSS, code injection, unsafe `child_process` usage, AST data-flow to dangerous sinks.
- **A05 Security Misconfiguration** — insecure `postMessage`, Semgrep misconfigurations, missing hardening.
- **A06 Vulnerable and Outdated Components** — npm audit findings and outdated packages.

## How to use this in reviews

1. Fix HIGH severity items in A02 and A03 first (secrets and injection).
2. Patch or upgrade A06 dependency issues with known exploits.
3. Use executive summaries for stakeholders; use technical reports for engineers.

## Hybrid AppSec approach

Use deterministic scanners (Semgrep, AST, npm audit, secrets rules) for findings. Use AI only to explain, prioritize, and summarize — not to invent vulnerabilities.
