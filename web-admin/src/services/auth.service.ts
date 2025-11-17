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
  // Profil par défaut basé sur Firebase Auth
  const defaultProfile: User = {
    uid,
    email: auth.currentUser?.email || '',
    displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin',
    role: UserRole.ADMIN,
  };

  try {
    // Essayer de récupérer depuis Firestore avec un timeout
    const userDoc = await Promise.race([
      getDoc(doc(db, 'users', uid)),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
    ]);

    if (!userDoc || !userDoc.exists()) {
      console.warn('⚠️ Document utilisateur non trouvé, utilisation du profil par défaut');
      return defaultProfile;
    }

    const data = userDoc.data();
    return {
      uid,
      email: data.email || defaultProfile.email,
      displayName: data.displayName || defaultProfile.displayName,
      role: data.role || UserRole.ADMIN,
    };
  } catch (error) {
    // Toute erreur (timeout, réseau, etc.) → utiliser le profil par défaut
    console.warn('⚠️ Firestore inaccessible, utilisation du profil par défaut');
    return defaultProfile;
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
      // Toujours appeler le callback avec un utilisateur valide
      // getUserProfile ne lance plus d'erreur, il retourne toujours un profil
      const user = await getUserProfile(firebaseUser.uid);
      callback(user);
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

