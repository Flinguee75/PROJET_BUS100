/**
 * Configuration Firebase Admin SDK
 * Initialisation pour europe-west4
 */

import * as admin from 'firebase-admin';

// Initialisation Firebase Admin
// Les credentials sont automatiquement détectées en production
// En local, utiliser GOOGLE_APPLICATION_CREDENTIALS
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'projet-bus-60a3f',
    databaseURL: 'https://projet-bus-60a3f.europe-west4.firebasedatabase.app',
  });
}

// Exports pour utilisation dans les services
export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging();
export const storage = admin.storage();

// Configuration région europe-west4
db.settings({
  ignoreUndefinedProperties: true,
});

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
