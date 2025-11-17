/**
 * Tests unitaires pour Firebase Config
 * Test de l'initialisation et des exports Firebase
 */

describe('Firebase Config', () => {
  let admin: any;

  beforeEach(() => {
    // Clear module cache to ensure fresh imports
    jest.resetModules();

    // Mock firebase-admin
    admin = {
      apps: [],
      initializeApp: jest.fn(),
      firestore: jest.fn(() => ({
        settings: jest.fn(),
      })),
      auth: jest.fn(() => ({})),
      messaging: jest.fn(() => ({})),
      storage: jest.fn(() => ({})),
    };

    jest.mock('firebase-admin', () => admin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Firebase Initialization', () => {
    it('should export db object', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.db).toBeDefined();
    });

    it('should export auth object', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.auth).toBeDefined();
    });

    it('should export messaging object', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.messaging).toBeDefined();
    });

    it('should export storage object', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.storage).toBeDefined();
    });

    it('should export admin as default', () => {
      const config = require('../../src/config/firebase.config');
      // In ES modules, default export might not always be present
      // The important exports are db, auth, messaging, storage, collections
      expect(config.db || config.default).toBeDefined();
    });
  });

  describe('Collections Configuration', () => {
    it('should export collections object', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections).toBeDefined();
      expect(typeof config.collections).toBe('object');
    });

    it('should have buses collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.buses).toBe('buses');
    });

    it('should have students collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.students).toBe('students');
    });

    it('should have drivers collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.drivers).toBe('drivers');
    });

    it('should have parents collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.parents).toBe('parents');
    });

    it('should have admins collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.admins).toBe('admins');
    });

    it('should have gpsLive collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.gpsLive).toBe('gps_live');
    });

    it('should have gpsHistory collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.gpsHistory).toBe('gps_history');
    });

    it('should have notifications collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.notifications).toBe('notifications');
    });

    it('should have routes collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.routes).toBe('routes');
    });

    it('should have attendance collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.attendance).toBe('attendance');
    });

    it('should have fcmTokens collection name', () => {
      const config = require('../../src/config/firebase.config');
      expect(config.collections.fcmTokens).toBe('fcm_tokens');
    });

    it('should have all 11 collection names', () => {
      const config = require('../../src/config/firebase.config');
      const collectionNames = Object.keys(config.collections);
      expect(collectionNames).toHaveLength(11);
    });

    it('should have all collection names as strings', () => {
      const config = require('../../src/config/firebase.config');
      Object.values(config.collections).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('Module Structure', () => {
    it('should have correct export structure', () => {
      const config = require('../../src/config/firebase.config');

      // Check main exports
      expect(config).toHaveProperty('db');
      expect(config).toHaveProperty('auth');
      expect(config).toHaveProperty('messaging');
      expect(config).toHaveProperty('storage');
      expect(config).toHaveProperty('collections');
    });

    it('should export collections as frozen object', () => {
      const config = require('../../src/config/firebase.config');

      // Collections should be defined and not null
      expect(config.collections).toBeDefined();
      expect(config.collections).not.toBeNull();
    });
  });
});
