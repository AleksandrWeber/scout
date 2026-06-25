import { getCliHelpText, parseCliArgs } from '../src/cli/parse-args';

describe('parseCliArgs', () => {
  it('returns help for empty argv', () => {
    expect(parseCliArgs([])).toEqual({ kind: 'help' });
    expect(getCliHelpText()).toContain('scout scan <path>');
  });

  it('parses a scan command with flags', () => {
    expect(
      parseCliArgs(['scan', './my-app', '--json', '--no-ai', '--locale', 'uk'])
    ).toEqual({
      kind: 'scan',
      options: {
        command: 'scan',
        projectPath: './my-app',
        locale: 'uk',
        json: true,
        includeAi: false
      }
    });
  });

  it('returns an error when path is missing', () => {
    expect(parseCliArgs(['scan'])).toEqual({
      kind: 'error',
      message: 'Project path is required. Usage: scout scan <path>'
    });
  });
});
