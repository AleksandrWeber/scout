import fs from 'fs/promises';
import path from 'path';

export type SecretFinding = {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'SECRET';
  file: string;
  line: number;
  description: string;
  risk: string;
  fix: string;
  education: string;
  secretType: string;
};

export type SecretsAnalysisResult = {
  findings: SecretFinding[];
  filesScanned: number;
};

type SecretRule = {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  regex: RegExp;
  description: string;
  risk: string;
  fix: string;
  education: string;
};

const PLACEHOLDER_PATTERN =
  /(changeme|example|placeholder|your[_-]?|xxx+|fake|dummy|sample|not[_-]?real|test[_-]?key)/i;

const secretRules: SecretRule[] = [
  {
    id: 'aws-access-key',
    severity: 'HIGH',
    regex: /AKIA[0-9A-Z]{16}/g,
    description: 'Possible AWS access key ID found in a project file.',
    risk: 'Leaked cloud credentials may allow attackers to access or abuse your AWS account.',
    fix: 'Revoke the exposed key, create a new IAM credential, and store it in environment variables or a secret manager.',
    education: 'AWS access keys should never live in source code or committed config files.'
  },
  {
    id: 'github-pat',
    severity: 'HIGH',
    regex: /gh[pousr]_[A-Za-z0-9_]{20,}/g,
    description: 'Possible GitHub personal access token found in a project file.',
    risk: 'A leaked GitHub token may allow repository access, code changes, or secret exfiltration.',
    fix: 'Revoke the token in GitHub settings and replace it with a new token stored outside the repo.',
    education: 'GitHub tokens grant API access and must be treated like passwords.'
  },
  {
    id: 'private-key',
    severity: 'HIGH',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    description: 'Private key material appears to be stored in the repository.',
    risk: 'Anyone with this key can impersonate your service or decrypt protected traffic.',
    fix: 'Remove the key from the repo, rotate the credential, and load keys from secure storage at runtime.',
    education: 'Private keys should never be committed to version control.'
  },
  {
    id: 'jwt-like',
    severity: 'MEDIUM',
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    description: 'JWT-like token pattern detected in a project file.',
    risk: 'Exposed tokens may allow session hijacking or unauthorized API access if still valid.',
    fix: 'Invalidate the token, avoid storing live tokens in files, and use short-lived credentials.',
    education: 'Bearer tokens in files often leak through git history and backups.'
  },
  {
    id: 'generic-api-secret',
    severity: 'MEDIUM',
    regex:
      /(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password)\s*[:=]\s*["']([^"']{12,})["']/gi,
    description: 'Hardcoded credential assignment detected.',
    risk: 'Secrets in code are easy to leak through git, logs, and build artifacts.',
    fix: 'Move the value to environment variables or a secret manager and rotate it if it was ever committed.',
    education: 'Configuration secrets should be injected at runtime, not checked into the project.'
  },
  {
    id: 'env-secret',
    severity: 'MEDIUM',
    regex:
      /^(?:export\s+)?([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*([^\s#]{8,})\s*$/gim,
    description: 'Sensitive environment variable with a literal value detected.',
    risk: 'Environment files are often copied, shared, or committed by mistake.',
    fix: 'Use .env.example with placeholders, keep real .env local, and rotate exposed values.',
    education: 'Treat .env files as secrets — exclude them from git and share only safe examples.'
  }
];

const scannableExtensions = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.env',
  '.yaml',
  '.yml',
  '.properties',
  '.toml',
  '.md'
]);

const ignoredDirectories = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.scout'
]);

const isPlaceholder = (value: string) => PLACEHOLDER_PATTERN.test(value);

const collectScannableFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectScannableFiles(fullPath)));
      }
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    const baseName = entry.name.toLowerCase();

    if (scannableExtensions.has(extension) || baseName.startsWith('.env')) {
      files.push(fullPath);
    }
  }

  return files;
};

const scanLine = (
  rule: SecretRule,
  relativePath: string,
  lineNumber: number,
  line: string
): SecretFinding | null => {
  const pattern = new RegExp(rule.regex.source, rule.regex.flags);
  const match = pattern.exec(line);
  if (!match) {
    return null;
  }

  const captured = match[1] || match[0];
  if (typeof captured === 'string' && isPlaceholder(captured)) {
    return null;
  }

  if (isPlaceholder(line)) {
    return null;
  }

  return {
    severity: rule.severity,
    category: 'SECRET',
    file: relativePath,
    line: lineNumber,
    description: rule.description,
    risk: rule.risk,
    fix: rule.fix,
    education: rule.education,
    secretType: rule.id
  };
};

export const analyzeSecrets = async (repoPath: string): Promise<SecretsAnalysisResult> => {
  const files = await collectScannableFiles(repoPath);
  const findings: SecretFinding[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const relativePath = path.relative(repoPath, file);
    const lines = content.split('\n');

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      for (const rule of secretRules) {
        const finding = scanLine(rule, relativePath, index + 1, line);
        if (!finding) {
          continue;
        }

        const dedupeKey = `${finding.file}:${finding.line}:${finding.secretType}`;
        if (seen.has(dedupeKey)) {
          continue;
        }

        seen.add(dedupeKey);
        findings.push(finding);
      }
    }
  }

  return {
    findings,
    filesScanned: files.length
  };
};
