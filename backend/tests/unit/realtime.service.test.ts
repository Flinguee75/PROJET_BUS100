/**
 * Tests unitaires pour RealtimeService
 * Test de la logique d'enrichissement des données bus en temps réel
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RealtimeService } from '../../src/services/realtime.service';
import { getDb } from '../../src/config/firebase.config';
import { BusStatus, BusMaintenanceStatus } from '../../src/types/bus.types';
import { BusLiveStatus } from '../../src/types/gps.types';

// Mock Firebase
jest.mock('../../src/config/firebase.config');

describe('RealtimeService', () => {
  let service: RealtimeService;
  let mockDb: any;

  beforeEach(() => {
    service = new RealtimeService();

    // Mock Firestore
    mockDb = {
      collection: jest.fn(),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBusesRealtime', () => {
    it('should return enriched bus data with GPS, driver, and route info', async () => {
      // Mock data
      const mockBuses = [
        {
          id: 'bus-1',
          data: () => ({
            plateNumber: 'CI 1001 AB 11',
            capacity: 35,
            model: 'Mercedes Sprinter',
            year: 2021,
            driverId: 'driver-1',
            routeId: 'route-1',
            status: BusStatus.ACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
        },
      ];

      const mockGPS = [
        {
          id: 'bus-1',
          data: () => ({
            busId: 'bus-1',
            position: {
              lat: 5.3473,
              lng: -3.9875,
              speed: 35,
              heading: 90,
              accuracy: 10,
              timestamp: Date.now(),
            },
            status: BusLiveStatus.EN_ROUTE,
            passengersCount: 25,
            lastUpdate: { toDate: () => new Date() },
          }),
        },
      ];

      const mockDrivers = [
        {
          id: 'driver-1',
          data: () => ({
            name: 'Kouassi Jean',
            phone: '+225 07 12 34 56 78',
            role: 'driver',
          }),
        },
      ];

      const mockRoutes = [
        {
          id: 'route-1',
          data: () => ({
            name: 'Cocody → Plateau',
            fromZone: 'Cocody',
            toZone: 'Plateau',
          }),
        },
      ];

      // Setup mocks
      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buses') {
          return { get: jest.fn().mockResolvedValue({ docs: mockBuses }) };
        }
        if (collectionName === 'gps_live') {
          return { get: jest.fn().mockResolvedValue({ docs: mockGPS }) };
        }
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ docs: mockDrivers }),
          };
        }
        if (collectionName === 'routes') {
          return { get: jest.fn().mockResolvedValue({ docs: mockRoutes }) };
        }
        return { get: jest.fn().mockResolvedValue({ docs: [] }) };
      });

      // Execute
      const result = await service.getAllBusesRealtime();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'bus-1',
        plateNumber: 'CI 1001 AB 11',
        capacity: 35,
        model: 'Mercedes Sprinter',
        year: 2021,
        status: BusStatus.ACTIVE,
        isActive: true,
        passengersCount: 25,
        liveStatus: BusLiveStatus.EN_ROUTE,
      });

      expect(result[0]?.driver).toMatchObject({
        id: 'driver-1',
        name: 'Kouassi Jean',
        phone: '+225 07 12 34 56 78',
      });

      expect(result[0]?.route).toMatchObject({
        id: 'route-1',
        name: 'Cocody → Plateau',
        fromZone: 'Cocody',
        toZone: 'Plateau',
      });

      expect(result[0]?.currentPosition).toBeDefined();
      expect(result[0]?.currentZone).toBe('Cocody'); // Should detect Cocody zone
    });

    it('should handle buses without GPS data', async () => {
      const mockBuses = [
        {
          id: 'bus-2',
          data: () => ({
            plateNumber: 'CI 1002 AB 12',
            capacity: 35,
            model: 'Toyota Coaster',
            year: 2022,
            driverId: null,
            routeId: null,
            status: BusStatus.INACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
        },
      ];

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buses') {
          return { get: jest.fn().mockResolvedValue({ docs: mockBuses }) };
        }
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ docs: [] }),
          };
        }
        return { get: jest.fn().mockResolvedValue({ docs: [] }) };
      });

      const result = await service.getAllBusesRealtime();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'bus-2',
        isActive: false,
        currentPosition: null,
        liveStatus: null,
        driver: null,
        route: null,
        passengersCount: 0,
        currentZone: null,
      });
    });

    it('should return empty array when no buses exist', async () => {
      mockDb.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
        where: jest.fn().mockReturnThis(),
      });

      const result = await service.getAllBusesRealtime();

      expect(result).toEqual([]);
    });
  });

  describe('getBusStatistics', () => {
    it('should calculate correct statistics', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          data: () => ({
            plateNumber: 'CI 1001 AB 11',
            capacity: 35,
            model: 'Mercedes',
            year: 2021,
            driverId: 'driver-1',
            routeId: 'route-1',
            status: BusStatus.ACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
        },
        {
          id: 'bus-2',
          data: () => ({
            plateNumber: 'CI 1002 AB 12',
            capacity: 35,
            model: 'Toyota',
            year: 2022,
            driverId: null,
            routeId: null,
            status: BusStatus.INACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
        },
      ];

      const mockGPS = [
        {
          id: 'bus-1',
          data: () => ({
            position: { lat: 5.3473, lng: -3.9875, speed: 35, timestamp: Date.now() },
            status: BusLiveStatus.EN_ROUTE,
            passengersCount: 25,
            lastUpdate: { toDate: () => new Date() },
          }),
        },
      ];

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buses') {
          return { get: jest.fn().mockResolvedValue({ docs: mockBuses }) };
        }
        if (collectionName === 'gps_live') {
          return { get: jest.fn().mockResolvedValue({ docs: mockGPS }) };
        }
        return {
          get: jest.fn().mockResolvedValue({ docs: [] }),
          where: jest.fn().mockReturnThis(),
        };
      });

      const stats = await service.getBusStatistics();

      expect(stats).toEqual({
        total: 2,
        active: 1,
        inactive: 1,
        enRoute: 1,
        stopped: 0,
        totalPassengers: 25,
      });
    });
  });

  describe('getBusRealtime', () => {
    it('should return specific bus with realtime data', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          data: () => ({
            plateNumber: 'CI 1001 AB 11',
            capacity: 35,
            model: 'Mercedes',
            year: 2021,
            driverId: 'driver-1',
            routeId: 'route-1',
            status: BusStatus.ACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
        },
      ];

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buses') {
          return { get: jest.fn().mockResolvedValue({ docs: mockBuses }) };
        }
        return {
          get: jest.fn().mockResolvedValue({ docs: [] }),
          where: jest.fn().mockReturnThis(),
        };
      });

      const result = await service.getBusRealtime('bus-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('bus-1');
    });

    it('should return null for non-existent bus', async () => {
      mockDb.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
        where: jest.fn().mockReturnThis(),
      });

      const result = await service.getBusRealtime('non-existent');

      expect(result).toBeNull();
    });
  });
});
