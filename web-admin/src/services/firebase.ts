/**
 * Configuration et initialisation Firebase
 * Utilise les variables d'environnement pour la config
 */

import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validation de la configuration
const hasValidConfig = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

// Initialisation de l'app Firebase (lazy)
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let initialized = false;

const initFirebase = () => {
  if (initialized && firebaseApp && firebaseAuth && firebaseDb) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
  }

  // Vérifier si la configuration est valide
  if (!hasValidConfig()) {
    const error = new Error('FIREBASE_NOT_CONFIGURED');
    (error as Error & { isConfigError: boolean }).isConfigError = true;
    throw error;
  }

  try {
    // Vérifier si Firebase est déjà initialisé
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }

    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);

    // Note: Les émulateurs Firebase doivent être lancés manuellement si nécessaire
    // En mode développement local, se connecter automatiquement aux émulateurs
    if (import.meta.env.DEV) {
      // Connexion aux émulateurs en mode développement
      try {
        connectAuthEmulator(firebaseAuth, 'http://localhost:9099', { disableWarnings: true });
        console.log('🔧 Connecté à l\'émulateur Auth Firebase');
      } catch (error) {
        console.log('ℹ️ Émulateur Auth non disponible, utilisation de Firebase production');
      }

      try {
        connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
        console.log('🔧 Connecté à l\'émulateur Firestore Firebase');
      } catch (error) {
        console.log('ℹ️ Émulateur Firestore non disponible, utilisation de Firebase production');
      }
    } else {
      console.log('ℹ️ Utilisation de Firebase production');
    }

    initialized = true;
    console.log('✅ Firebase initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
    
    if (error instanceof Error && error.message === 'FIREBASE_NOT_CONFIGURED') {
      throw error;
    }
    
    // Autres erreurs Firebase
    console.error('❌ Impossible d\'initialiser Firebase. Vérifiez votre configuration.');
    throw error;
  }

  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
};

// Initialiser Firebase immédiatement de manière sûre
if (hasValidConfig()) {
  try {
    initFirebase();
    console.log('✅ Firebase prêt');
  } catch (error) {
    if (!(error instanceof Error && error.message === 'FIREBASE_NOT_CONFIGURED')) {
      console.error('❌ Erreur Firebase:', error);
    }
  }
}

// Exports simples - Firebase est déjà initialisé ou lèvera une erreur à l'utilisation
export const app = firebaseApp!;
export const auth = firebaseAuth!;
export const db = firebaseDb!;

// Fonctions getter pour une vérification supplémentaire si nécessaire
export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    throw new Error('Firebase app not initialized. Check your .env configuration.');
  }
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    throw new Error('Firebase auth not initialized. Check your .env configuration.');
  }
  return firebaseAuth;
};

export const getFirebaseDb = (): Firestore => {
  if (!firebaseDb) {
    throw new Error('Firebase db not initialized. Check your .env configuration.');
  }
  return firebaseDb;
};

