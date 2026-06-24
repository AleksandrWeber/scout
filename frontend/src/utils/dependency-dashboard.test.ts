import { groupDependencyFindingsByPackage } from './dependency-dashboard';
import { Finding } from '../types';

const createDependencyFinding = (overrides: Partial<Finding> = {}): Finding => ({
  severity: 'HIGH',
  category: 'DEPENDENCY_VULNERABILITY',
  file: 'package.json',
  description: 'lodash: Prototype Pollution',
  risk: 'Prototype pollution risk.',
  fix: 'Update lodash to 4.17.21 or later.',
  education: 'npm audit found a vulnerability.',
  dependency: {
    packageName: 'lodash',
    cveIds: ['CVE-2021-23337'],
    vulnerableVersions: '<4.17.21',
    patchedVersion: '4.17.21',
    exploitAvailable: true,
    priorityScore: 374
  },
  ...overrides
});

describe('dependency-dashboard utils', () => {
  it('groups findings by package and sorts by priority score', () => {
    const groups = groupDependencyFindingsByPackage([
      createDependencyFinding({
        dependency: {
          packageName: 'minimist',
          cveIds: ['CVE-2020-7598'],
          exploitAvailable: false,
          priorityScore: 210
        }
      }),
      createDependencyFinding(),
      createDependencyFinding({
        description: 'lodash: Second advisory',
        dependency: {
          packageName: 'lodash',
          cveIds: ['CVE-2020-15256'],
          vulnerableVersions: '<4.17.20',
          patchedVersion: '4.17.20',
          exploitAvailable: false,
          priorityScore: 320
        }
      })
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].packageName).toBe('lodash');
    expect(groups[0].findings).toHaveLength(2);
    expect(groups[0].priorityScore).toBe(374);
    expect(groups[1].packageName).toBe('minimist');
  });
});
