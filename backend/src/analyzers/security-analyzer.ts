import fs from 'fs/promises';
import path from 'path';
import { runSemgrep, SemgrepResult } from '../services/semgrep.service';

export type VulnerabilityFinding = {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  file: string;
  description: string;
  risk: string;
  fix: string;
  education: string;
};

export type SecurityAnalysisResult = {
  findings: VulnerabilityFinding[];
  semgrepStatus: SemgrepResult['status'];
  semgrepMessage?: string;
  semgrepCount: number;
};

const patterns = [
  {
    category: 'XSS',
    regex: /dangerouslySetInnerHTML/gi,
    severity: 'HIGH' as const,
    description: 'Uses dangerouslySetInnerHTML in a React component.',
    risk: 'This can introduce cross-site scripting if rendered content contains user input.',
    fix: 'Avoid dangerouslySetInnerHTML and use safe JSX rendering or sanitize values before use.',
    education: 'dangerouslySetInnerHTML bypasses React built-in escaping and may allow attacker-controlled scripts to execute.'
  },
  {
    category: 'XSS',
    regex: /\.innerHTML\s*=/gi,
    severity: 'HIGH' as const,
    description: 'Assigns directly to innerHTML.',
    risk: 'Direct innerHTML assignment can execute malicious HTML or script content from untrusted sources.',
    fix: 'Use textContent, DOM APIs, or sanitize content before setting innerHTML.',
    education: 'innerHTML writes raw HTML into the DOM and does not escape user input automatically.'
  },
  {
    category: 'CODE_INJECTION',
    regex: /eval\s*\(/gi,
    severity: 'HIGH' as const,
    description: 'Calls eval() with dynamic input.',
    risk: 'eval() can execute attacker-controlled strings as code, resulting in remote code execution.',
    fix: 'Remove eval() and use safer alternatives such as JSON.parse or explicit parsing logic.',
    education: 'eval is unsafe because it treats strings as executable code and can be manipulated by an attacker.'
  },
  {
    category: 'CODE_INJECTION',
    regex: /document\.write\s*\(/gi,
    severity: 'MEDIUM' as const,
    description: 'Uses document.write() to insert HTML.',
    risk: 'document.write can introduce XSS if the inserted content is not strictly controlled.',
    fix: 'Use DOM APIs like createElement and appendChild, or sanitize the written content.',
    education: 'document.write appends HTML directly to the page and should be avoided in modern applications.'
  },
  {
    category: 'CODE_INJECTION',
    regex: /new\s+Function\s*\(/gi,
    severity: 'HIGH' as const,
    description: 'Constructs code dynamically using new Function().',
    risk: 'new Function() executes strings as code, which may be controlled by attackers and lead to remote code execution.',
    fix: 'Avoid dynamic code generation and use explicit functions or parsed data structures instead.',
    education: 'new Function behaves like eval and opens the same attack surface for injection.'
  }
];

export const analyzeSecurityPatterns = async (repoPath: string): Promise<SecurityAnalysisResult> => {
  const files = await collectSourceFiles(repoPath);
  const findings: VulnerabilityFinding[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const relativePath = path.relative(repoPath, file);

    for (const pattern of patterns) {
      const match = content.match(pattern.regex);
      if (!match) continue;

      findings.push({
        severity: pattern.severity,
        category: pattern.category,
        file: relativePath,
        description: pattern.description,
        risk: pattern.risk,
        fix: pattern.fix,
        education: pattern.education
      });
    }
  }

  const semgrepAnalysis = await runSemgrep(repoPath);
  const allFindings = [...findings, ...semgrepAnalysis.findings];

  if (allFindings.length === 0) {
    allFindings.push({
      severity: 'LOW',
      category: 'STATIC_SCAN',
      file: 'N/A',
      description: 'No security patterns were detected by the initial scanner.',
      risk: 'A deeper analysis may still reveal more issues, especially in dynamic code paths.',
      fix: 'Integrate Semgrep or AST-based analysis to improve coverage.',
      education: 'This scanner runs lightweight pattern matching and is a first step toward a richer AppSec analysis pipeline.'
    });
  }

  return {
    findings: allFindings,
    semgrepStatus: semgrepAnalysis.status,
    semgrepMessage: semgrepAnalysis.message,
    semgrepCount: semgrepAnalysis.count
  };
};

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (fullPath.match(/\.(js|jsx|ts|tsx)$/i)) {
      files.push(fullPath);
    }
  }

  return files;
};
