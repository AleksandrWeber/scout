import { render, screen } from '@testing-library/react';
import { SemgrepStatusType } from '../types';
import SemgrepStatus from './SemgrepStatus';

describe('SemgrepStatus', () => {
  it('renders a success state', () => {
    render(<SemgrepStatus status="success" message="All clear" count={0} />);

    expect(screen.getByText(/Semgrep OK/i)).toBeInTheDocument();
    expect(screen.getByText(/All clear/i)).toBeInTheDocument();
    expect(screen.getByText(/Semgrep findings: 0/i)).toBeInTheDocument();
  });

  it('renders a fallback state for unknown or invalid statuses', () => {
    render(<SemgrepStatus status={'invalid' as SemgrepStatusType} />);

    expect(screen.getByText(/Semgrep Unknown/i)).toBeInTheDocument();
  });
});
