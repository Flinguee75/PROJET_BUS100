/**
 * Tests unitaires pour GPS Service
 * Test de la logique métier du tracking GPS
 */

import { GPSService } from '../../src/services/gps.service';
import { collections } from '../../src/config/firebase.config';
import { BusLiveStatus, GPSUpdateInput } from '../../src/types';

// Mock Firebase
jest.mock('../../src/config/firebase.config', () => ({
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
  getDb: jest.fn(),
  getAuth: jest.fn(),
  getMessaging: jest.fn(),
  getStorage: jest.fn(),
}));

describe('GPSService', () => {
  let gpsService: GPSService;
  let mockDb: any;
  const { getDb } = require('../../src/config/firebase.config');

  beforeEach(() => {
    gpsService = new GPSService();

    // Setup mock Firestore
    mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
        })),
        get: jest.fn(),
      })),
    };

    // Mock getDb to return our mockDb
    getDb.mockReturnValue(mockDb);
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two GPS points correctly', () => {
      // Paris (48.8566, 2.3522) to Lyon (45.7640, 4.8357)
      const distance = gpsService.calculateDistance(
        48.8566,
        2.3522,
        45.764,
        4.8357
      );

      // Distance réelle ≈ 392 km
      expect(distance).toBeGreaterThan(390);
      expect(distance).toBeLessThan(400);
    });

    it('should return 0 for same coordinates', () => {
      const distance = gpsService.calculateDistance(
        48.8566,
        2.3522,
        48.8566,
        2.3522
      );

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = gpsService.calculateDistance(-33.8688, 151.2093, 40.7128, -74.006);

      // Sydney to New York ≈ 16000 km
      expect(distance).toBeGreaterThan(15000);
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA correctly for normal speed', () => {
      // Distance 50km, vitesse 100km/h = 30 minutes
      const eta = gpsService.calculateETA(48.8566, 2.3522, 48.5, 2.3, 100);

      expect(eta).toBeGreaterThan(20);
      expect(eta).toBeLessThan(40);
    });

    it('should return -1 when speed is 0', () => {
      const eta = gpsService.calculateETA(48.8566, 2.3522, 48.5, 2.3, 0);

      expect(eta).toBe(-1);
    });

    it('should handle slow speeds', () => {
      // Distance courte, vitesse lente
      const eta = gpsService.calculateETA(48.8566, 2.3522, 48.86, 2.36, 5);

      expect(eta).toBeGreaterThan(0);
    });
  });

  describe('determineBusStatus', () => {
    it('should return STOPPED when speed is 0', () => {
      const service = new GPSService();
      // @ts-ignore - accessing private method for testing
      const status = service.determineBusStatus(0);

      return expect(status).resolves.toBe('stopped');
    });

    it('should return EN_ROUTE when speed is above 0', () => {
      const service = new GPSService();
      // @ts-ignore - accessing private method for testing
      const status = service.determineBusStatus(3);

      return expect(status).resolves.toBe('en_route');
    });

    it('should return EN_ROUTE when speed is above 5', () => {
      const service = new GPSService();
      // @ts-ignore - accessing private method for testing
      const status = service.determineBusStatus(50);

      return expect(status).resolves.toBe('en_route');
    });
  });

  describe('updateGPSPosition', () => {
    it('should update GPS position successfully', async () => {
      const mockBusData = {
        plateNumber: 'BUS-001',
        driverId: 'driver-123',
        routeId: 'route-456',
        capacity: 50,
      };

      const mockBusDoc = {
        exists: true,
        data: () => mockBusData,
      };

      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockGet = jest.fn().mockResolvedValue(mockBusDoc);
      const mockDoc = jest.fn(() => ({
        get: mockGet,
        set: mockSet,
      }));

      const mockSubCollection = jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn().mockResolvedValue(undefined),
        })),
      }));

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.buses) {
          return { doc: mockDoc };
        }
        if (name === collections.gpsLive) {
          return { doc: mockDoc };
        }
        if (name === collections.gpsHistory) {
          return {
            doc: jest.fn(() => ({
              collection: mockSubCollection,
            })),
          };
        }
        return { doc: mockDoc };
      });

      mockDb.collection = mockCollection;

      const gpsData: GPSUpdateInput = {
        busId: 'bus-001',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        heading: 180,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const result = await gpsService.updateGPSPosition(gpsData);

      expect(result).toBeDefined();
      expect(result.busId).toBe('bus-001');
      expect(result.status).toBe(BusLiveStatus.EN_ROUTE);
      expect(result.driverId).toBe('driver-123');
      expect(mockSet).toHaveBeenCalled();
    });

    it('should handle missing driverId', async () => {
      const mockBusData = {
        plateNumber: 'BUS-001',
        // No driverId
        routeId: 'route-456',
        capacity: 50,
      };

      const mockBusDoc = {
        exists: true,
        data: () => mockBusData,
      };

      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockGet = jest.fn().mockResolvedValue(mockBusDoc);
      const mockDoc = jest.fn(() => ({
        get: mockGet,
        set: mockSet,
      }));

      const mockSubCollection = jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn().mockResolvedValue(undefined),
        })),
      }));

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.buses) {
          return { doc: mockDoc };
        }
        if (name === collections.gpsLive) {
          return { doc: mockDoc };
        }
        if (name === collections.gpsHistory) {
          return {
            doc: jest.fn(() => ({
              collection: mockSubCollection,
            })),
          };
        }
        return { doc: mockDoc };
      });

      mockDb.collection = mockCollection;

      const gpsData: GPSUpdateInput = {
        busId: 'bus-001',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = await gpsService.updateGPSPosition(gpsData);

      expect(result).toBeDefined();
      expect(result.driverId).toBe(''); // Default value when driverId is missing
    });

    it('should handle missing routeId', async () => {
      const mockBusData = {
        plateNumber: 'BUS-001',
        driverId: 'driver-123',
        // No routeId
        capacity: 50,
      };

      const mockBusDoc = {
        exists: true,
        data: () => mockBusData,
      };

      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockGet = jest.fn().mockResolvedValue(mockBusDoc);
      const mockDoc = jest.fn(() => ({
        get: mockGet,
        set: mockSet,
      }));

      const mockSubCollection = jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn().mockResolvedValue(undefined),
        })),
      }));

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.buses) {
          return { doc: mockDoc };
        }
        if (name === collections.gpsLive) {
          return { doc: mockDoc };
        }
        if (name === collections.gpsHistory) {
          return {
            doc: jest.fn(() => ({
              collection: mockSubCollection,
            })),
          };
        }
        return { doc: mockDoc };
      });

      mockDb.collection = mockCollection;

      const gpsData: GPSUpdateInput = {
        busId: 'bus-001',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = await gpsService.updateGPSPosition(gpsData);

      expect(result).toBeDefined();
      expect(result.routeId).toBeNull(); // Default value when routeId is missing
    });

    it('should throw error when bus does not exist', async () => {
      const mockBusDoc = {
        exists: false,
        data: () => null,
      };

      const mockGet = jest.fn().mockResolvedValue(mockBusDoc);
      const mockDoc = jest.fn(() => ({
        get: mockGet,
      }));

      const mockCollection = jest.fn(() => ({
        doc: mockDoc,
      }));

      mockDb.collection = mockCollection;

      const gpsData: GPSUpdateInput = {
        busId: 'non-existent-bus',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      await expect(gpsService.updateGPSPosition(gpsData)).rejects.toThrow(
        'Bus non-existent-bus not found'
      );
    });

    it('should throw error when bus has no data', async () => {
      const mockBusDoc = {
        exists: true,
        data: () => null,
      };

      const mockGet = jest.fn().mockResolvedValue(mockBusDoc);
      const mockDoc = jest.fn(() => ({
        get: mockGet,
      }));

      const mockCollection = jest.fn(() => ({
        doc: mockDoc,
      }));

      mockDb.collection = mockCollection;

      const gpsData: GPSUpdateInput = {
        busId: 'bus-no-data',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      await expect(gpsService.updateGPSPosition(gpsData)).rejects.toThrow(
        'Bus bus-no-data has no data'
      );
    });
  });

  describe('getLivePosition', () => {
    it('should return live position when bus exists', async () => {
      const mockPosition = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          timestamp: Date.now(),
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: 'route-456',
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      const mockDoc = {
        exists: true,
        id: 'bus-001',
        data: () => mockPosition,
      };

      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = jest.fn(() => ({
        get: mockGet,
      }));

      const mockCollection = jest.fn(() => ({
        doc: mockDocRef,
      }));

      mockDb.collection = mockCollection;

      const result = await gpsService.getLivePosition('bus-001');

      expect(result).toEqual(
        expect.objectContaining({
          busId: 'bus-001',
          driverId: 'driver-123',
          routeId: 'route-456',
          status: BusLiveStatus.EN_ROUTE,
        })
      );
      expect(mockGet).toHaveBeenCalled();
    });

    it('should normalize BusRealtimeData shape from gps_live', async () => {
      const now = Date.now();
      const mockRealtimeDoc = {
        currentPosition: {
          lat: 5.3473,
          lng: -3.9875,
          speed: 35,
          heading: 90,
          accuracy: 10,
          timestamp: now,
        },
        liveStatus: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-789',
        routeId: 'route-123',
        passengersCount: 12,
        lastUpdate: now,
      };

      const mockDoc = {
        exists: true,
        id: 'bus-789',
        data: () => mockRealtimeDoc,
      };

      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = jest.fn(() => ({
        get: mockGet,
      }));

      const mockCollection = jest.fn(() => ({
        doc: mockDocRef,
      }));

      mockDb.collection = mockCollection;

      const result = await gpsService.getLivePosition('bus-789');

      expect(result).toEqual(
        expect.objectContaining({
          busId: 'bus-789',
          position: mockRealtimeDoc.currentPosition,
          status: BusLiveStatus.EN_ROUTE,
          driverId: 'driver-789',
          routeId: 'route-123',
          passengersCount: 12,
          lastUpdate: new Date(now),
        })
      );
    });

    it('should return null when bus does not exist', async () => {
      const mockDoc = {
        exists: false,
        data: () => null,
      };

      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = jest.fn(() => ({
        get: mockGet,
      }));

      const mockCollection = jest.fn(() => ({
        doc: mockDocRef,
      }));

      mockDb.collection = mockCollection;

      const result = await gpsService.getLivePosition('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllLivePositions', () => {
    it('should return all live positions', async () => {
      const mockPositions = [
        {
          busId: 'bus-001',
          position: { lat: 48.8566, lng: 2.3522, speed: 50, timestamp: Date.now() },
          status: BusLiveStatus.EN_ROUTE,
          driverId: 'driver-123',
          routeId: 'route-456',
          passengersCount: 0,
          lastUpdate: new Date(),
        },
        {
          busId: 'bus-002',
          position: { lat: 45.764, lng: 4.8357, speed: 30, timestamp: Date.now() },
          status: BusLiveStatus.EN_ROUTE,
          driverId: 'driver-456',
          routeId: 'route-789',
          passengersCount: 0,
          lastUpdate: new Date(),
        },
      ];

      const mockDocs = mockPositions.map((pos) => ({
        id: pos.busId,
        data: () => pos,
      }));

      const mockSnapshot = {
        docs: mockDocs,
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockCollection = jest.fn(() => ({
        get: mockGet,
      }));

      mockDb.collection = mockCollection;

      const result = await gpsService.getAllLivePositions();

      expect(result).toEqual(mockPositions);
      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should normalize mixed gps_live document shapes', async () => {
      const now = Date.now();
      const mockDocs = [
        {
          id: 'bus-legacy',
          data: () => ({
            position: { lat: 1, lng: 2, speed: 10, timestamp: now },
            status: BusLiveStatus.EN_ROUTE,
            driverId: 'driver-1',
            routeId: 'route-1',
            passengersCount: 3,
            lastUpdate: now,
          }),
        },
        {
          id: 'bus-realtime',
          data: () => ({
            currentPosition: { lat: 3, lng: 4, speed: 20, timestamp: now },
            liveStatus: BusLiveStatus.STOPPED,
            driverId: 'driver-2',
            routeId: 'route-2',
            passengersCount: 5,
            lastUpdate: { toDate: () => new Date(now) },
          }),
        },
        {
          id: 'bus-missing',
          data: () => ({
            liveStatus: BusLiveStatus.EN_ROUTE,
          }),
        },
      ];

      const mockSnapshot = {
        docs: mockDocs,
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockCollection = jest.fn(() => ({
        get: mockGet,
      }));

      mockDb.collection = mockCollection;

      const result = await gpsService.getAllLivePositions();

      expect(result).toHaveLength(2);
      expect(result[0]?.busId).toBe('bus-legacy');
      expect(result[1]?.busId).toBe('bus-realtime');
      expect(result[1]?.status).toBe(BusLiveStatus.STOPPED);
    });

    it('should return empty array when no positions exist', async () => {
      const mockSnapshot = {
        docs: [],
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockCollection = jest.fn(() => ({
        get: mockGet,
      }));

      mockDb.collection = mockCollection;

      const result = await gpsService.getAllLivePositions();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getHistoryForDay', () => {
    it('should return history for a specific day', async () => {
      const mockHistory = [
        {
          busId: 'bus-001',
          position: { lat: 48.8566, lng: 2.3522, speed: 50, timestamp: Date.now() },
          timestamp: new Date(),
        },
        {
          busId: 'bus-001',
          position: { lat: 48.8600, lng: 2.3550, speed: 55, timestamp: Date.now() },
          timestamp: new Date(),
        },
      ];

      const mockDocs = mockHistory.map((entry) => ({
        data: () => entry,
      }));

      const mockSnapshot = {
        docs: mockDocs,
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockOrderBy = jest.fn(() => ({
        get: mockGet,
      }));

      const mockSubCollection = jest.fn(() => ({
        orderBy: mockOrderBy,
      }));

      const mockDoc = jest.fn(() => ({
        collection: mockSubCollection,
      }));

      const mockCollection = jest.fn(() => ({
        doc: mockDoc,
      }));

      mockDb.collection = mockCollection;

      const targetDate = new Date('2024-01-15');
      const result = await gpsService.getHistoryForDay('bus-001', targetDate);

      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'asc');
    });

    it('should return empty array when no history exists', async () => {
      const mockSnapshot = {
        docs: [],
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockOrderBy = jest.fn(() => ({
        get: mockGet,
      }));

      const mockSubCollection = jest.fn(() => ({
        orderBy: mockOrderBy,
      }));

      const mockDoc = jest.fn(() => ({
        collection: mockSubCollection,
      }));

      const mockCollection = jest.fn(() => ({
        doc: mockDoc,
      }));

      mockDb.collection = mockCollection;

      const targetDate = new Date('2024-01-15');
      const result = await gpsService.getHistoryForDay('bus-001', targetDate);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
