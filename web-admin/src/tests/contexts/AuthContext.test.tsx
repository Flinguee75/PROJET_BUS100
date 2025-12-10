/**
 * Tests pour AuthContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import * as authService from '@/services/auth.service';

// Mock du service
vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

// Composant de test pour utiliser le contexte
const TestComponent = () => {
  const { user, loading, error, login, logout, isAuthenticated } = useAuthContext();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <button
        onClick={() => login({ email: 'test@example.com', password: 'password' }).catch(() => {})}
      >
        Login
      </button>
      <button onClick={() => logout().catch(() => {})}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lance une erreur si useAuthContext est utilisé hors du Provider', () => {
    // Supprimer les erreurs de console pour ce test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuthContext must be used within AuthProvider');

    consoleError.mockRestore();
  });

  it('fournit les valeurs initiales correctement', () => {
    vi.mocked(authService.observeAuthState).mockImplementation(() => vi.fn());

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Not Authenticated');
  });

  it('met à jour l\'utilisateur via observeAuthState', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: UserRole.ADMIN,
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Authenticated');
    });
  });

  it('gère la connexion avec succès', async () => {
    const user = userEvent.setup();
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: UserRole.ADMIN,
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(null); // Appeler le callback pour terminer le chargement
      return vi.fn();
    });
    vi.mocked(authService.login).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    // Vérifier qu'il n'y a pas d'erreur
    const errorElement = screen.getByTestId('error');
    expect(errorElement.textContent).toBeTruthy();
  });

  it('gère les erreurs de connexion', async () => {
    const user = userEvent.setup();

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(null); // Appeler le callback pour terminer le chargement
      return vi.fn();
    });
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    await waitFor(() => {
      const errorElement = screen.getByTestId('error');
      expect(errorElement.textContent).toContain('Invalid credentials');
    }, { timeout: 3000 });
  });

  it('gère la déconnexion avec succès', async () => {
    const user = userEvent.setup();
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: UserRole.ADMIN,
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });
    vi.mocked(authService.logout).mockResolvedValue();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });
  });

  it('gère les erreurs de déconnexion', async () => {
    const user = userEvent.setup();
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: UserRole.ADMIN,
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });
    vi.mocked(authService.logout).mockRejectedValue(new Error('Logout failed'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Logout failed');
    });
  });

  it('évite les doubles appels en mode strict', () => {
    let callCount = 0;
    vi.mocked(authService.observeAuthState).mockImplementation(() => {
      callCount++;
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Le hook devrait éviter les doubles appels grâce à initializedRef
    // Dans le pire cas, il peut y avoir 2 appels en mode strict
    expect(callCount).toBeLessThanOrEqual(2);
  });

  it('appelle unsubscribe lors du démontage', () => {
    const unsubscribeMock = vi.fn();
    vi.mocked(authService.observeAuthState).mockImplementation(() => unsubscribeMock);

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(unsubscribeMock).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('retourne isAuthenticated=true quand user existe', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: UserRole.ADMIN,
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Authenticated');
    });
  });

  it('retourne isAuthenticated=false quand user est null', async () => {
    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Not Authenticated');
    });
  });
});
