#!/usr/bin/env node
import 'dotenv/config';
import { LocalProjectError } from '../errors/local-project.errors';
import { formatScanSummary } from './format-scan-output';
import { getCliHelpText, parseCliArgs } from './parse-args';
import { analyzeLocalProject } from '../services/report.service';

const run = async () => {
  const parsed = parseCliArgs(process.argv.slice(2));

  if (parsed.kind === 'help') {
    process.stdout.write(`${getCliHelpText()}\n`);
    return;
  }

  if (parsed.kind === 'error') {
    process.stderr.write(`Error: ${parsed.message}\n\n${getCliHelpText()}\n`);
    process.exitCode = 1;
    return;
  }

  try {
    const report = await analyzeLocalProject(parsed.options.projectPath, {
      locale: parsed.options.locale,
      includeAi: parsed.options.includeAi
    });

    if (parsed.options.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return;
    }

    process.stdout.write(`${formatScanSummary(report)}\n`);
  } catch (error) {
    if (error instanceof LocalProjectError) {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exitCode = 1;
      return;
    }

    console.error(error);
    process.stderr.write('Error: Failed to scan local project.\n');
    process.exitCode = 1;
  }
};

void run();
