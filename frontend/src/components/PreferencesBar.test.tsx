import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PreferencesBar from './PreferencesBar';
import { renderWithProviders } from '../test-utils';

describe('PreferencesBar', () => {
  it('switches UI language to Ukrainian', async () => {
    renderWithProviders(<PreferencesBar />);

    await userEvent.click(screen.getByRole('button', { name: 'UK' }));

    expect(screen.getByText('Мова')).toBeInTheDocument();
    expect(screen.getByText('Тема')).toBeInTheDocument();
  });

  it('switches theme to dark mode', async () => {
    renderWithProviders(<PreferencesBar />);

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('persists language and theme for the next visit', async () => {
    const { unmount } = renderWithProviders(<PreferencesBar />);

    await userEvent.click(screen.getByRole('button', { name: 'UK' }));
    await userEvent.click(screen.getByRole('button', { name: 'Темна' }));

    expect(localStorage.getItem('scout-locale')).toBe('uk');
    expect(localStorage.getItem('scout-theme')).toBe('dark');

    unmount();
    renderWithProviders(<PreferencesBar />);

    expect(screen.getByRole('button', { name: 'UK' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Темна' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('App i18n', () => {
  it('renders Ukrainian empty state after switching language', async () => {
    const { default: App } = await import('../App');
    renderWithProviders(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'UK' }));

    expect(
      screen.getByText('Поки немає знахідок. Введіть URL GitHub-репозиторію, щоб почати аналіз.')
    ).toBeInTheDocument();
  });
});
