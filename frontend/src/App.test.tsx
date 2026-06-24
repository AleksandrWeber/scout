import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders initial state and shows findings after analyzing a repository', async () => {
    const fakeResponse = {
      repoUrl: 'https://github.com/example/repo',
      findings: [
        {
          category: 'XSS',
          file: 'src/index.ts',
          severity: 'HIGH',
          description: 'Unsanitized input is rendered.',
          risk: 'Script injection might occur.',
          fix: 'Escape user input.',
          education: 'Do not render raw user content.'
        }
      ],
      dependencyFindings: [],
      semgrep: {
        status: 'success',
        message: '1 issue found',
        count: 1
      }
    };

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => fakeResponse
    })));

    render(<App />);
    expect(screen.getByText(/No findings yet/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await act(async () => {
      await user.type(screen.getByPlaceholderText(/https:\/\/github\.com\/owner\/repo/i), 'https://github.com/example/repo');
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
    });

    await waitFor(() => expect(screen.getByText(/Analyzed repository:/i)).toBeInTheDocument());
    expect(screen.getByText(/src\/index\.ts \(index\.ts\)/i)).toBeInTheDocument();
    expect(screen.getByText('1 issue found')).toBeInTheDocument();
  });

  it('clears the form and analysis results', async () => {
    const fakeResponse = {
      repoUrl: 'https://github.com/example/repo',
      findings: [
        {
          category: 'XSS',
          file: 'src/index.ts',
          severity: 'HIGH',
          description: 'Unsanitized input is rendered.',
          risk: 'Script injection might occur.',
          fix: 'Escape user input.',
          education: 'Do not render raw user content.'
        }
      ],
      dependencyFindings: [],
      semgrep: {
        status: 'success',
        message: '1 issue found',
        count: 1
      }
    };

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => fakeResponse
    })));

    render(<App />);

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/https:\/\/github\.com\/owner\/repo/i);

    await act(async () => {
      await user.type(input, 'https://github.com/example/repo');
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
    });

    await waitFor(() => expect(screen.getByText(/Analyzed repository:/i)).toBeInTheDocument());

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Clear/i }));
    });

    expect(input).toHaveValue('');
    expect(screen.queryByText(/Analyzed repository:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/src\/index\.ts \(index\.ts\)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No findings yet/i)).toBeInTheDocument();
  });

  it('shows dependency findings in a separate dashboard tab', async () => {
    const fakeResponse = {
      repoUrl: 'https://github.com/example/repo',
      findings: [],
      dependencyFindings: [
        {
          category: 'DEPENDENCY_VULNERABILITY',
          file: 'package.json',
          severity: 'HIGH',
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
          }
        }
      ],
      semgrep: {
        status: 'success',
        message: '',
        count: 0
      }
    };

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => fakeResponse
    })));

    render(<App />);

    const user = userEvent.setup();
    await act(async () => {
      await user.type(screen.getByPlaceholderText(/https:\/\/github\.com\/owner\/repo/i), 'https://github.com/example/repo');
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
    });

    await waitFor(() => expect(screen.getByText(/Dependencies \(1\)/i)).toBeInTheDocument());
    expect(screen.getByText('lodash')).toBeInTheDocument();
    expect(screen.getByText(/Prototype Pollution/)).toBeInTheDocument();
    expect(screen.getAllByText(/Exploit likely/)).toHaveLength(2);
    expect(screen.getAllByText(/Priority 374/)).toHaveLength(2);
  });
});
