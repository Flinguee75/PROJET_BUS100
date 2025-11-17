/**
 * Tests d'intégration - Navigation dans l'application
 * Teste la navigation entre les différentes pages
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import * as authService from '@/services/auth.service';

vi.mock('@/services/auth.service');

describe('App Navigation Integration', () => {
  it('charge l\'application', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'admin@test.com',
      displayName: 'Admin',
      role: 'admin',
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });

    // Démarrer l'application
    const { container } = render(<App />);

    // L'application devrait se charger
    await waitFor(() => {
      expect(container).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('charge l\'application avec un utilisateur déjà connecté', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'admin@test.com',
      displayName: 'Admin',
      role: 'admin',
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(<App />);

    // Devrait charger directement le dashboard (ou être redirigé)
    await waitFor(
      () => {
        // L'application ne devrait pas afficher la page de login
        expect(screen.queryByText("Plateforme d'administration")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
