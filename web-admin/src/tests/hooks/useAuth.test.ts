/**
 * Tests pour le hook useAuth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/auth.service';

// Mock du service d'authentification
vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialise avec loading=true et user=null', () => {
    vi.mocked(authService.observeAuthState).mockImplementation(() => {
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('met à jour l\'utilisateur quand observeAuthState est appelé', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('connecte un utilisateur avec succès', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
    };

    vi.mocked(authService.observeAuthState).mockImplementation(() => vi.fn());
    vi.mocked(authService.login).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    const credentials = { email: 'test@example.com', password: 'password123' };
    const loggedUser = await result.current.login(credentials);

    expect(loggedUser).toEqual(mockUser);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBe(null);
    });
  });

  it('gère les erreurs de connexion', async () => {
    vi.mocked(authService.observeAuthState).mockImplementation(() => vi.fn());
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    const credentials = { email: 'test@example.com', password: 'wrong' };

    await expect(result.current.login(credentials)).rejects.toThrow('Invalid credentials');

    await waitFor(() => {
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.user).toBe(null);
    });
  });

  it('déconnecte l\'utilisateur avec succès', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });
    vi.mocked(authService.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await result.current.logout();

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  it('gère les erreurs de déconnexion', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });
    vi.mocked(authService.logout).mockRejectedValue(new Error('Logout failed'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await expect(result.current.logout()).rejects.toThrow('Logout failed');

    await waitFor(() => {
      expect(result.current.error).toBe('Logout failed');
    });
  });

  it('appelle unsubscribe lors du démontage', () => {
    const unsubscribeMock = vi.fn();
    vi.mocked(authService.observeAuthState).mockImplementation(() => unsubscribeMock);

    const { unmount } = renderHook(() => useAuth());

    expect(unsubscribeMock).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('retourne isAuthenticated=true quand user existe', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
    };

    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('retourne isAuthenticated=false quand user est null', async () => {
    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('met loading à false après l\'observation', async () => {
    vi.mocked(authService.observeAuthState).mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('conserve les fonctions login et logout entre les rendus', () => {
    vi.mocked(authService.observeAuthState).mockImplementation(() => vi.fn());

    const { result, rerender } = renderHook(() => useAuth());

    const loginFn = result.current.login;
    const logoutFn = result.current.logout;

    rerender();

    expect(result.current.login).toBe(loginFn);
    expect(result.current.logout).toBe(logoutFn);
  });
});
