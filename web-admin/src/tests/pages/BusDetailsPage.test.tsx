/**
 * Tests pour BusDetailsPage
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusDetailsPage } from '@/pages/BusDetailsPage';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn(() => vi.fn()),
  login: vi.fn(),
  logout: vi.fn(),
}));

// Mock de useParams pour React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ busId: 'test-bus-id' }),
  };
});

describe('BusDetailsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderBusDetailsPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <BusDetailsPage />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('rend la page de détails du bus', () => {
    const { container } = renderBusDetailsPage();
    // Le test vérifie simplement que le composant se rend sans erreur
    expect(container).toBeInTheDocument();
  });
});
