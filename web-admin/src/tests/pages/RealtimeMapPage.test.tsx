/**
 * Tests pour RealtimeMapPage
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RealtimeMapPage } from '@/pages/RealtimeMapPage';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn(() => vi.fn()),
  login: vi.fn(),
  logout: vi.fn(),
}));

describe('RealtimeMapPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderRealtimeMapPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <RealtimeMapPage />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('rend la page de carte en temps réel', () => {
    const { container } = renderRealtimeMapPage();
    // Le test vérifie simplement que le composant se rend sans erreur
    expect(container).toBeInTheDocument();
  });
});
