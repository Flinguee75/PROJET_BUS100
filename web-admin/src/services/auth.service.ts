/**
 * Service d'authentification
 * Gère la connexion/déconnexion des utilisateurs
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, LoginCredentials, UserRole } from '@/types/auth';

/**
 * Connexion d'un utilisateur avec email et mot de passe
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    const user = await getUserProfile(userCredential.user.uid);
    return user;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    throw new Error('Email ou mot de passe incorrect');
  }
};

/**
 * Déconnexion de l'utilisateur
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw new Error('Erreur lors de la déconnexion');
  }
};

/**
 * Récupère le profil utilisateur depuis Firestore
 */
export const getUserProfile = async (uid: string): Promise<User> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      // Si le profil n'existe pas, créer un profil par défaut
      return {
        uid,
        email: auth.currentUser?.email || '',
        role: UserRole.ADMIN,
      };
    }

    const data = userDoc.data();
    return {
      uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role || UserRole.ADMIN,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    throw new Error('Impossible de récupérer le profil utilisateur');
  }
};

/**
 * Observer l'état d'authentification
 */
export const observeAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const user = await getUserProfile(firebaseUser.uid);
        callback(user);
      } catch (error) {
        console.error('Erreur lors de l\'observation de l\'état:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Récupère l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

