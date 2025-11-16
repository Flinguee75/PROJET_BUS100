/**
 * Configuration globale Jest
 * S'exécute avant tous les tests
 */

// Mock Firebase Admin pour les tests
jest.mock('../src/config/firebase.config', () => ({
  db: {
    collection: jest.fn(),
  },
  auth: {},
  messaging: {},
  storage: {},
  collections: {
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
  },
}));

// Configuration timeout global
jest.setTimeout(10000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
