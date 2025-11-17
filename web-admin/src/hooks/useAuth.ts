/**
 * Hook personnalisé pour gérer l'authentification
 * Fournit l'état de l'utilisateur et les fonctions de connexion/déconnexion
 */

import { useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials } from '@/types/auth';
import * as authService from '@/services/auth.service';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Observer l'état d'authentification au chargement - UNE SEULE FOIS
  useEffect(() => {
    const unsubscribe = authService.observeAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Nettoyage lors du démontage
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides = exécuter UNE SEULE FOIS

  /**
   * Connexion de l'utilisateur
   * Retourne l'utilisateur pour permettre la navigation dans le composant
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      const loggedUser = await authService.login(credentials);
      setUser(loggedUser);
      setLoading(false);
      return loggedUser;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la connexion';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Déconnexion de l'utilisateur
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la déconnexion';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: user !== null,
  };
};

