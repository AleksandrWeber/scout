# Secrets and credentials in source code

Hardcoded API keys, tokens, private keys, and database passwords in repositories are a leading cause of account compromise. Attackers scan public Git history and CI logs within minutes of a leak.

## What to avoid

- Committing `.env` files or real credentials to Git.
- Embedding `sk_live`, `ghp_`, `AKIA`, or PEM private keys in application code.
- Logging secrets in error messages or client-side bundles.

## Secure alternatives

- Store secrets in environment variables or a secret manager (GitHub Actions secrets, Vault, cloud provider secret store).
- Rotate any credential that was ever committed, even if later removed from history.
- Use scoped tokens with least privilege and short TTL.

## OWASP mapping

Cryptographic Failures (A02:2021) includes sensitive data exposure through hardcoded secrets and weak protection of credentials at rest.

## Response playbook

1. Revoke and rotate the exposed credential immediately.
2. Remove the secret from code and purge it from Git history if needed.
3. Add pre-commit or CI secret scanning to prevent recurrence.
