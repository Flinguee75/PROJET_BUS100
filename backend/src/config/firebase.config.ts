/**
 * Configuration Firebase Admin SDK
 * Initialisation pour europe-west4
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialisation Firebase Admin
if (!admin.apps.length) {
  // Configuration de base
  const config: admin.AppOptions = {
    projectId: 'projet-bus-60a3f',
  };

  // En mode émulateur, pas besoin de credentials réelles
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    // Mode émulateur - utiliser les credentials de test
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    console.log('🔧 Mode Emulator: Pas de service account requis');
  } else {
    // Production ou développement local - utiliser le service account
    // Production - utiliser la vraie database URL
    config.databaseURL = 'https://projet-bus-60a3f.europe-west4.firebasedatabase.app';

    // Chercher le service account dans l'ordre de priorité :
    // 1. Variable d'environnement GOOGLE_APPLICATION_CREDENTIALS
    // 2. Fichier service-account-key.json dans le dossier backend
    let serviceAccountPath: string | undefined;
    let serviceAccount: admin.ServiceAccount | undefined;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Priorité 1: Variable d'environnement
      serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log(`📁 Utilisation du service account depuis: ${serviceAccountPath}`);
    } else {
      // Priorité 2: Fichier local dans backend/
      const localServiceAccountPath = path.join(__dirname, '../../service-account-key.json');

      if (fs.existsSync(localServiceAccountPath)) {
        serviceAccountPath = localServiceAccountPath;
        console.log(`📁 Service account trouvé localement: ${serviceAccountPath}`);
      } else {
        console.warn('⚠️ Service account non trouvé. Utilisation des credentials par défaut.');
        console.warn('   Options:');
        console.warn('   1. Définir GOOGLE_APPLICATION_CREDENTIALS');
        console.warn('   2. Placer service-account-key.json dans backend/');
      }
    }

    // Charger le service account si trouvé
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccountJson = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

        serviceAccount = {
          projectId: serviceAccountJson.project_id,
          clientEmail: serviceAccountJson.client_email,
          privateKey: serviceAccountJson.private_key.replace(/\\n/g, '\n'),
        };

        config.credential = admin.credential.cert(serviceAccount);
        console.log('✅ Service account chargé avec succès');
      } catch (error) {
        console.error('❌ Erreur lors du chargement du service account:', error);
        console.warn('⚠️ Utilisation des credentials par défaut (peut échouer en production)');
      }
    } else {
      // En production sur Cloud Functions, les credentials sont automatiquement détectées
      // En local sans service account, cela échouera mais c'est attendu
      console.warn('⚠️ Service account non trouvé. Firebase utilisera les credentials par défaut.');
    }
  }

  admin.initializeApp(config);
}

// Lazy initialization pour éviter les erreurs si les émulateurs ne sont pas démarrés
let _db: admin.firestore.Firestore | undefined;
let _auth: admin.auth.Auth | undefined;
let _messaging: admin.messaging.Messaging | undefined;
let _storage: admin.storage.Storage | undefined;

// Fonction getter avec lazy loading - à utiliser partout dans le code
// Les clients ne sont créés que quand ils sont appelés, pas au chargement du module
export function getDb(): admin.firestore.Firestore {
  if (!_db) {
    _db = admin.firestore();
    _db.settings({
      ignoreUndefinedProperties: true,
    });
  }
  return _db;
}

export function getAuth(): admin.auth.Auth {
  if (!_auth) {
    _auth = admin.auth();
  }
  return _auth;
}

export function getMessaging(): admin.messaging.Messaging {
  if (!_messaging) {
    _messaging = admin.messaging();
  }
  return _messaging;
}

export function getStorage(): admin.storage.Storage {
  if (!_storage) {
    _storage = admin.storage();
  }
  return _storage;
}

// Exports pour compatibilité (deprecated - préférer les getters ci-dessus)
// NOTE: Ces exports sont fournis pour la compatibilité TypeScript mais ne doivent PAS être utilisés
// Utilisez les fonctions getDb(), getAuth(), etc. à la place
export const db = null as any as admin.firestore.Firestore;
export const auth = null as any as admin.auth.Auth;
export const messaging = null as any as admin.messaging.Messaging;
export const storage = null as any as admin.storage.Storage;

// Collections Firestore
export const collections = {
  buses: 'buses',
  students: 'students',
  drivers: 'drivers',
  parents: 'parents',
  admins: 'admins',
  gpsLive: 'gps_live',
  gpsHistory: 'gps_history',
  notifications: 'notifications',
  routes: 'routes',
  attendance: 'attendance',
  fcmTokens: 'fcm_tokens',
};

export default admin;
