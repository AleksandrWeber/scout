import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { AppPreferencesProvider } from './context/AppPreferencesContext';

const Providers = ({ children }: { children: ReactNode }) => (
  <AppPreferencesProvider>{children}</AppPreferencesProvider>
);

export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: Providers, ...options });
