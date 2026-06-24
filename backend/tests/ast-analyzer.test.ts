import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { analyzeAstDataFlow } from '../src/analyzers/ast-analyzer';

const fixtureRepo = path.join(__dirname, 'fixtures/ast-vulnerable');

const copyFixtureRepo = async (): Promise<string> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-ast-'));
  await fs.cp(fixtureRepo, tempDir, { recursive: true });
  return tempDir;
};

describe('analyzeAstDataFlow', () => {
  it('detects user input flowing into eval and innerHTML sinks', async () => {
    const repoPath = await copyFixtureRepo();
    const result = await analyzeAstDataFlow(repoPath);

    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.findings.length).toBeGreaterThanOrEqual(3);
    expect(result.findings.every((finding) => finding.category === 'AST_DATA_FLOW')).toBe(true);

    const sinks = result.findings.map((finding) => finding.description);
    expect(sinks.some((description) => description.includes('eval()'))).toBe(true);
    expect(sinks.some((description) => description.includes('innerHTML'))).toBe(true);
    expect(sinks.some((description) => description.includes('req.body'))).toBe(true);
    expect(sinks.some((description) => description.includes('req.query'))).toBe(true);
  });

  it('tracks taint through local variables before reaching a sink', async () => {
    const repoPath = await copyFixtureRepo();
    const result = await analyzeAstDataFlow(repoPath);

    const eventFlow = result.findings.find((finding) => finding.description.includes('event.target.value'));
    expect(eventFlow).toBeDefined();
    expect(eventFlow?.line).toBeGreaterThan(0);
  });

  it('returns no findings for safe code', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-ast-safe-'));
    await fs.writeFile(
      path.join(tempDir, 'safe.js'),
      `const total = 1 + 2;\nconsole.log(total);\n`,
      'utf8'
    );

    const result = await analyzeAstDataFlow(tempDir);
    expect(result.findings).toHaveLength(0);
  });
});
