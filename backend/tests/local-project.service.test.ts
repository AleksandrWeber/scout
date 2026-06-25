import path from 'path';
import { resolveLocalProjectPath, getProjectNameFromPath } from '../src/services/local-project.service';

describe('local-project.service', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/sample-repo');

  it('resolves an existing fixture directory', async () => {
    await expect(resolveLocalProjectPath(fixturePath)).resolves.toBe(fixturePath);
  });

  it('rejects a missing directory', async () => {
    await expect(resolveLocalProjectPath(path.join(fixturePath, 'missing-dir'))).rejects.toThrow(
      'Project path does not exist'
    );
  });

  it('extracts project name from path', () => {
    expect(getProjectNameFromPath('/Users/me/projects/my-app')).toBe('my-app');
  });
});
