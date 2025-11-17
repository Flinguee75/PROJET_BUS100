/**
 * Tests pour DashboardPage
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/DashboardPage';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn(() => vi.fn()),
  login: vi.fn(),
  logout: vi.fn(),
}));

describe('DashboardPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderDashboardPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <DashboardPage />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('rend la page dashboard', () => {
    const { container } = renderDashboardPage();
    // Le test vérifie simplement que le composant se rend sans erreur
    expect(container).toBeInTheDocument();
  });
});
