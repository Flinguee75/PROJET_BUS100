/**
 * Contexte d'authentification global
 * Gère l'état utilisateur de manière centralisée et stable
 */

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, LoginCredentials } from '@/types/auth';
import { useSchool } from '@/hooks/useSchool';
import type { School } from '@/types/school';
import * as authService from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  school: School | null;
  loading: boolean;
  schoolLoading: boolean;
  schoolError: string | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const {
    school,
    isLoading: schoolLoading,
    error: schoolError,
  } = useSchool(user?.schoolId ?? null);

  // Observer l'état d'authentification - une seule fois au montage
  useEffect(() => {
    // Éviter les doubles appels en mode strict
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    // Timeout de sécurité : arrêter le loading après 3 secondes max
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout de chargement - arrêt forcé du loading');
      setLoading(false);
    }, 3000);

    const unsubscribe = authService.observeAuthState((currentUser) => {
      clearTimeout(loadingTimeout);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      setError(null);
      const loggedUser = await authService.login(credentials);
      // L'état sera mis à jour par observeAuthState
      return loggedUser;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la connexion';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await authService.logout();
      // L'état sera mis à jour par observeAuthState
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la déconnexion';
      setError(errorMessage);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    school,
    loading,
    schoolLoading,
    schoolError,
    error,
    login,
    logout,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
