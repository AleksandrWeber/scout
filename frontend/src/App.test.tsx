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
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
    expect(screen.getByText('1 issue found')).toBeInTheDocument();
  });
});
