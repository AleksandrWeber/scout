export type ScanCliOptions = {
  command: 'scan';
  projectPath: string;
  locale: 'en' | 'uk';
  json: boolean;
  includeAi: boolean;
};

export type ParsedCliArgs =
  | { kind: 'help' }
  | { kind: 'error'; message: string }
  | { kind: 'scan'; options: ScanCliOptions };

const HELP_TEXT = `Scout CLI — local AppSec scans

Usage:
  scout scan <path> [options]

Options:
  --locale <en|uk>   Report language for AI explanations (default: en)
  --json             Print full JSON report to stdout
  --no-ai            Skip AI explanations (faster, offline-friendly)
  --help             Show this help

Examples:
  scout scan ./my-app
  scout scan /Users/me/projects/my-app --json
  scout scan ./my-app --no-ai --locale uk
`;

export const getCliHelpText = (): string => HELP_TEXT;

export const parseCliArgs = (argv: string[]): ParsedCliArgs => {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    return { kind: 'help' };
  }

  const [command, ...rest] = argv;

  if (command !== 'scan') {
    return { kind: 'error', message: `Unknown command "${command}". Use "scout scan <path>".` };
  }

  let projectPath = '';
  let locale: 'en' | 'uk' = 'en';
  let json = false;
  let includeAi = true;

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (token === '--json') {
      json = true;
      continue;
    }

    if (token === '--no-ai') {
      includeAi = false;
      continue;
    }

    if (token === '--locale') {
      const value = rest[index + 1];
      if (value !== 'en' && value !== 'uk') {
        return { kind: 'error', message: 'Invalid --locale value. Use "en" or "uk".' };
      }
      locale = value;
      index += 1;
      continue;
    }

    if (token.startsWith('--')) {
      return { kind: 'error', message: `Unknown option "${token}".` };
    }

    if (!projectPath) {
      projectPath = token;
      continue;
    }

    return { kind: 'error', message: `Unexpected argument "${token}".` };
  }

  if (!projectPath) {
    return { kind: 'error', message: 'Project path is required. Usage: scout scan <path>' };
  }

  return {
    kind: 'scan',
    options: {
      command: 'scan',
      projectPath,
      locale,
      json,
      includeAi
    }
  };
};
