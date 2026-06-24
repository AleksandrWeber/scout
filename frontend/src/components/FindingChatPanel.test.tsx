import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FindingChatPanel from './FindingChatPanel';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  sendSecurityChatMessage: vi.fn()
}));

const finding = {
  category: 'XSS',
  file: 'src/App.tsx',
  line: 42,
  severity: 'HIGH' as const,
  description: 'Unsanitized user input is rendered directly into HTML.',
  risk: 'An attacker can inject script code into the page.',
  fix: 'Escape user-provided values before rendering them to the DOM.',
  education: 'XSS is a class of vulnerabilities that allow execution of untrusted JavaScript.'
};

describe('FindingChatPanel', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('sends a question and shows the assistant reply', async () => {
    vi.mocked(api.sendSecurityChatMessage).mockResolvedValue({
      reply: 'Sanitize HTML before using dangerouslySetInnerHTML.',
      provider: 'local'
    });

    render(<FindingChatPanel finding={finding} />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/Ask a question about this finding/i), 'How do I fix this?');
    await user.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() =>
      expect(screen.getByText(/Sanitize HTML before using dangerouslySetInnerHTML/i)).toBeInTheDocument()
    );
    expect(api.sendSecurityChatMessage).toHaveBeenCalledWith({
      finding,
      message: 'How do I fix this?',
      history: []
    });
  });
});
