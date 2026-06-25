# Dependency vulnerabilities (npm audit)

Third-party packages can ship known CVEs. `npm audit` compares your lockfile against the npm advisory database and reports affected version ranges.

## Risk factors

- Transitive dependencies you do not directly import.
- Packages without available patches (monitor advisories).
- High CVSS or public exploit proof-of-concepts.

## Remediation

- Upgrade to the patched version listed in the advisory.
- If no fix exists, evaluate replacements, temporary mitigations, or accepting risk with compensating controls.
- Pin versions with `package-lock.json` and review lockfile changes in pull requests.

## OWASP mapping

Vulnerable and Outdated Components (A06:2021) covers using libraries with known security defects.

## PR review tip

When `package.json` or `package-lock.json` changes in a pull request, run dependency audit on that revision before merge.
