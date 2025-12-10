/**
 * Tests pour le service d'authentification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importer les mocks AVANT le service pour que vi.mock s'applique
import '../mocks/firebase.mock';
import {
  mockSignInWithEmailAndPassword,
  mockSignOut,
  mockGetDoc,
  mockDoc,
} from '../mocks/firebase.mock';
import * as authService from '@/services/auth.service';
import { UserRole } from '@/types/auth';

// Mock du service firebase local
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('connecte un utilisateur avec succès', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          role: UserRole.ADMIN,
        }),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );

      expect(result).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.ADMIN,
      });
    });

    it('gère les erreurs de connexion', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('Invalid credentials')
      );

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Email ou mot de passe incorrect');
    });
  });

  describe('logout', () => {
    it('déconnecte l\'utilisateur avec succès', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await authService.logout();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('gère les erreurs de déconnexion', async () => {
      mockSignOut.mockRejectedValue(new Error('Logout error'));

      await expect(authService.logout()).rejects.toThrow(
        'Erreur lors de la déconnexion'
      );
    });
  });

  describe('getUserProfile', () => {
    it('récupère le profil utilisateur depuis Firestore', async () => {
      mockDoc.mockReturnValue({ id: 'user-123' });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          role: UserRole.ADMIN,
        }),
      });

      const result = await authService.getUserProfile('user-123');

      expect(result).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.ADMIN,
      });
    });

    it('crée un profil par défaut si inexistant', async () => {
      mockDoc.mockReturnValue({ id: 'user-123' });

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await authService.getUserProfile('user-123');

      expect(result).toEqual({
        uid: 'user-123',
        email: '',
        displayName: 'Admin',
        role: UserRole.ADMIN,
      });
    });
  });
});

